import { AbstractProperty } from "./abstract-property";
import { ValueChangeListener, ValueChangeListenerReference } from "./value-change-listener";
import { Trigger, TriggerListener } from "./trigger";
import { BackpressureType } from "./backpressure/backpressure-type";
import { Logger } from "../util/logger/logger";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { ValidationMessage } from "../validators/validation-message";
import { PropertyDependency } from "../dependency-graph/property-dependency";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { AssertionError } from "../util/assertions/assertion-error";
import { ValidatorInstance } from "../engine/validation/validator-instance-impl";
import { AbstractDataProperty } from "./abstract-data-property";
import { PropertyValidator } from "../validators/property-validator";

export interface AbstractPropertyWithInternals<D> extends AbstractDataProperty<D> {
    internallyUpdate(): Promise<void> | void;
    hasBeenUpdated(): void;
    errorWhileUpdating(error: any): void;
    dependencyHasBeenUpdated(dependency: PropertyDependency): void;
    addValidator<Properties extends readonly AbstractProperty[]>(validator: ValidatorInstance<Properties>): void;
}

interface UpdatedListener {
    resolve: () => void;
    reject: (reason?: any) => void;
}

export abstract class AbstractPropertyImpl<D> implements AbstractPropertyWithInternals<D> {

    private automaticallyUpdate = true;
    private manuallyTriggered?: boolean;
    private triggerListener?: TriggerListener;

    private needsToRecompute?: boolean; // needsToRecompute iff true or undefined
    private recomputingCount?: number;
    private currentRecomputing?: Promise<void>; // the current recompting of update process
    private updatedListeners?: UpdatedListener[];

    private needsToRevalidate?: boolean; // needsToRevalidate iff true or undefined
    private validators?: ValidatorInstance<readonly AbstractProperty[]>[];
    private validationMessages: ValidationMessage[] = [];

    private valueChangeListeners?: [ref: number, vcl: ValueChangeListener][];
    private nextValueChangeListenerId?: number;

    protected propertyValidators: PropertyValidator<any>[] = [];

    abstract id: string;
    backpressureConfig?: BackpressureConfig;
    private label?: string;

    constructor(
        protected updateHandler: RuleEngineUpdateHandler,
        backpressureConfig?: BackpressureConfig
    ) {
        this.backpressureConfig = backpressureConfig;
    }

    // ---------------------------------------------------------------------------------------
    // -- handing internallyUpdate -----------------------------------------------------------
    // ---------------------------------------------------------------------------------------

    /**
     * Do a synchronous update
     */
    protected abstract internallySyncUpdate(): void;

    /**
     * The bare async update - here no handling of backpresure and so on - its done by AbstractPropertyImpl
     */
    protected abstract internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void };

    /**
     * Awaits the async update. If needed, an update is triggered
     * @param thenFcn applied after update has finished
     */
    protected awaitAsyncUpdate(): Promise<void> | undefined {
        if (this.needsToRecompute !== false && this.automaticallyUpdate) {
            return this.updateHandler.updateValue(this);
        } else {
            return this.updatingPromise();
        }
    }

    private updatingPromise(): Promise<void> | undefined {
        if (this.currentRecomputing) {
            return new Promise<void>((resolve, reject) => {
                const ul = { resolve, reject } as UpdatedListener;
                if(!this.updatedListeners) {
                    this.updatedListeners = [ul]
                } else {
                    this.updatedListeners.push(ul);
                }
            });
        }
    }

    private nextRecomputingCount() {
        this.recomputingCount = ((this.recomputingCount ?? 0) % Number.MAX_SAFE_INTEGER) + 1;
        return this.recomputingCount;
    }

    /**
     * Checks if an update is needed and triggers the update if it is the case.
     */
    protected syncUpdateIfNeeded(): void {
        if (!this.isAsynchronous() && this.needsToRecompute !== false && this.automaticallyUpdate) {
            void this.updateHandler.updateValue(this);
        }
    }

    private getTriggerListener(): TriggerListener {
        if (!this.triggerListener) {
            this.triggerListener = {
                onTriggered: () => {
                    if (this.needsToRecompute !== false) {
                        this.manuallyTriggered = true;
                        return this.updateHandler.updateValue(this) ?? Promise.resolve();
                    } else {
                        return Promise.resolve();
                    }
                }
            };
        }
        return this.triggerListener;
    }

    // -----------------------------------------------------------------------------------

    internallyUpdate(): Promise<void> | void {
        if (this.needsToRecompute === false || (!this.automaticallyUpdate && !this.manuallyTriggered)) {
            return this.updatingPromise();
        }
        this.needsToRecompute = false;
        delete this.manuallyTriggered;
        if (this.isAsynchronous()) {
            if (this.currentRecomputing) {
                return this.handleBackpressure();
            } else {
                return this.handleAsyncUpdate(this.nextRecomputingCount(), false);
            }
        } else {
            this.internallySyncUpdate();
        }
    }

    private handleBackpressure(): Promise<void> {
        if (!this.backpressureConfig) {
            throw new AssertionError('AbstractPropertyImpl: backpressureConfig needs to be defined');
        }
        switch (this.backpressureConfig.type) {
            case 'switch' as BackpressureType:
                if (this.backpressureConfig.debounceTime) {
                    return this.handleAsyncUpdateWithDebounceTime(this.backpressureConfig.debounceTime);
                } else {
                    return this.handleAsyncUpdate(this.nextRecomputingCount(), true);
                }
            case 'skip' as BackpressureType:
            default:
                return this.updatingPromise() ?? Promise.resolve();
        }
    }

    private async handleAsyncUpdateWithDebounceTime(debounceTime: number): Promise<void> {
        const recomputingCount = this.nextRecomputingCount();
        await Promise.race([
            this.currentRecomputing,
            new Promise<void>(resolve => setTimeout(() => resolve(), debounceTime))
        ]);
        return this.handleAsyncUpdate(recomputingCount, true);
    }

    private handleAsyncUpdate(recomputingCount: number, wasAlreadyProcessing: boolean): Promise<void> {
        if (recomputingCount !== this.recomputingCount) {
            Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount} is skipped (${this.recomputingCount})`);
            return this.updatingPromise() ?? Promise.resolve();
        }
        Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount}`);
        const update = this.internallyAsyncUpdate<unknown>();
        this.currentRecomputing = update.asyncPromise.then((value) => {
            Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount} / ${this.recomputingCount}`);
            if (recomputingCount === this.recomputingCount) {
                Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: updated`);
                this.currentRecomputing = undefined;
                update.resolve(value);
                this.updatedListeners?.forEach(ul => ul.resolve());
                delete this.updatedListeners;
            } else if (this.currentRecomputing) { // there is already a new computing
                return this.currentRecomputing;
            }
        });

        if (this.isProcessing() && !wasAlreadyProcessing) {
            this.tellValueChangeListeners(listener => listener.startsAsyncUpdate?.());
        }
        return this.updatingPromise() ?? Promise.resolve();
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyUpdate: END ------------------------------------------------------
    // ---------------------------------------------------------------------------------------

    needsAnUpdate(notifyOthers?: boolean, needsToRecompute?: boolean): void {
        Logger.trace(() => `Property.needsAnUpdate ${this.id}`);
        this.needsToRecompute = needsToRecompute ?? true;
        this.cancelValidationAndInvalidateResults();

        // chain is controlled by RuleEngine Class, it will set notifyOthers to false
        if (notifyOthers !== false) {
            this.updateHandler.needsAnUpdate(this);
        }

        this.tellValueChangeListeners(listener => listener.needsAnUpdate?.());
    }

    hasBeenUpdated() {
        this.tellValueChangeListeners(listener => listener.updated());
    }

    errorWhileUpdating(error: any): void {
        this.updatedListeners?.forEach(ul => ul.reject(error));
        delete this.updatedListeners;
        this.tellValueChangeListeners(listener => listener.updateFailed?.(error));
    }

    dependencyHasBeenUpdated(dependency: PropertyDependency) {
        if (dependency.options.validation) {
            this.cancelValidationAndInvalidateResults();
        }
        this.tellValueChangeListeners(listener => listener.dependencyHasBeenUpdated?.(dependency));
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyValidate  --------------------------------------------------------
    // ---------------------------------------------------------------------------------------

    addPropertyValidator(validator: PropertyValidator<any>) {
        this.propertyValidators.push(validator);
    }

    protected getSinglePropertyValidationResults() {
        return this.propertyValidators.reduce((res, sv) => {
            const msg = sv(this);
            if (msg) {
                res.push(msg);
            }
            return res;
        }, [] as ValidationMessage[]);
    }

    addValidator<Properties extends readonly AbstractProperty[]>(validator: ValidatorInstance<Properties>) {
        if (!this.validators) {
            this.validators = [];
        }
        this.validators.push(validator as unknown as ValidatorInstance<readonly AbstractProperty[]>);
    }

    async validate(): Promise<ValidationMessage[]> {
        if (this.needsToRevalidate !== false) {
            this.needsToRevalidate = false;
            const updated = this.awaitAsyncUpdate();
            if (updated) {
                await updated;
            }
            const validationMessages: ValidationMessage[] = this.getSinglePropertyValidationResults();
            if (this.validators) {
                const results = await Promise.all(this.updateHandler.validateValidatorInstances(this.validators));
                if (results.some(res => res === 'cancelled')) {
                    return this.getValidationMessages();
                }
                results.forEach(result => {
                    if (result instanceof Array) {
                        validationMessages.push(...result);
                    } else if (result instanceof Object && result[this.id]) {
                        validationMessages.push(...result[this.id]);
                    }
                });
            }
            this.updateValidationMessages(validationMessages);
        }
        return this.getValidationMessages();
    }

    isValid(): boolean {
        return this.validationMessages.every(msg => msg.type.isValid);
    }

    setValidationMessages(messages: ValidationMessage[]): void {
        this.cancelValidationAndInvalidateResults();
        this.updateValidationMessages(messages);
    }

    getValidationMessages(): ValidationMessage[] {
        return this.validationMessages;
    }

    clearValidationResult(): void {
        this.cancelValidationAndInvalidateResults();
        this.updateValidationMessages([]);
    }

    private cancelValidationAndInvalidateResults() {
        this.needsToRevalidate = true;
        if (this.validators) {
            this.updateHandler.cancelValidationAndInvalidateResults(this.validators);
        }
    }

    private updateValidationMessages(validationMessages: ValidationMessage[]) {
        this.validationMessages = validationMessages;
        this.tellValueChangeListeners(listener => listener.validated?.());
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyValidate: END ----------------------------------------------------
    // ---------------------------------------------------------------------------------------

    registerValueChangedListener(changed: ValueChangeListener): ValueChangeListenerReference {
        if (!this.valueChangeListeners) {
            this.valueChangeListeners = [];
        }

        const id = this.nextValueChangeListenerId ?? 0;
        this.nextValueChangeListenerId = id + 1;
        const ref = { id } as ValueChangeListenerReference;

        this.valueChangeListeners.push([id, changed]);
        if (changed.needsAnUpdate && (this.needsToRecompute !== false || this.needsToRevalidate !== false)) {
            changed.needsAnUpdate();
        }
        return ref;
    }

    deregisterValueChangedListener(changed?: ValueChangeListenerReference): void {
        if (this.valueChangeListeners && changed !== undefined) {
            const index = this.valueChangeListeners.findIndex(e => e[0] === changed.id);
            if (index >= 0) {
                this.valueChangeListeners.splice(index, 1);
            }
        }
    }

    protected hasValueChangeListeners() {
        return this.valueChangeListeners !== undefined && this.valueChangeListeners.length  > 0;
    }

    protected tellValueChangeListeners(fcn: (listener: ValueChangeListener) => void) {
        this.valueChangeListeners?.forEach(e => fcn(e[1]));
    }

    // --------------------------------------------------------------------------------------

    setUpdateStrategy(strategy: 'Automatic' | 'Manually'): void {
        this.automaticallyUpdate = strategy === 'Automatic';
    }

    addUpdateTrigger(trigger: Trigger, setUpdateStrategyManually = true): void {
        if (setUpdateStrategyManually) {
            this.setUpdateStrategy("Manually");
        }
        trigger.registerTriggerListener(this.getTriggerListener());
    }

    removeUpdateTrigger(trigger: Trigger): void {
        if (this.triggerListener) {
            trigger.deregisterTriggerListener(this.triggerListener);
        }
    }

    // --------------------------------------------------------------------------------------

    defineLabel(label: string) {
        this.label = label;
    }

    getLabel(): string {
        return this.label ?? '';
    }

    // --------------------------------------------------------------------------------------
    
    transferData(toProperty: AbstractDataProperty<D>): void {
        toProperty.importData(this.exportData());
    }

    abstract isAsynchronous(): boolean;
    abstract isProcessing(): boolean;
    abstract isReadOnly(): boolean;
    abstract setToInitialState(): void;
    abstract exportData(): D | null;
    abstract importData(data: D | null): void;
}
