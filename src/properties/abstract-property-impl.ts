import { AbstractProperty } from "./abstract-property";
import { ValueChangeListener } from "./value-change-listener";
import { Trigger, TriggerListener } from "./trigger";
import { BackpressureType } from "./backpressure/backpressure-type";
import { Logger } from "../util/logger/logger";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";
import { ValidationMessage } from "../validators/validation-message";
import { Validator } from "../validators/validator";
import { PropertyDependency } from "../dependency-graph/property-dependency";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { AssertionError } from "../util/assertions/assertion-error";

export interface AbstractPropertyWithInternals<D> extends AbstractProperty<D> {
    internallyUpdate(): Promise<void>;
    hasBeenUpdated(): void;
    errorWhileUpdating(error: any): void;
    dependencyHasBeenUpdated(dependency: PropertyDependency): void;
    internallyRequiresEagerUpdate(): boolean;
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
    private isAboutToStartValidation?: boolean; // isAboutToStartValidation iff true
    private validationCounter?: number;
    private readonly validators: Validator[] = [];
    private validationMessages: ValidationMessage[] = [];


    constructor(
        protected updateHandler: RuleEngineUpdateHandler<D>,
        backpressureConfig?: BackpressureConfig
    ) {
        this.backpressureConfig = backpressureConfig;
    }

    private readonly valueChangeListeners: ValueChangeListener[] = [];

    abstract id: string;

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
    protected awaitAsyncUpdate(): Promise<void> {
        if (this.needsToRecompute !== false && this.automaticallyUpdate) {
            return this.updateHandler.updateValue(this);
        } else {
            return this.updatedPromise();
        }
    }

    private updatedPromise() {
        if (this.currentRecomputing) {
            return new Promise<void>((resolve, reject) => {
                const ul = { resolve, reject } as UpdatedListener;
                if(!this.updatedListeners) {
                    this.updatedListeners = [ul]
                } else {
                    this.updatedListeners.push(ul);
                }
            });
        } else {
            return Promise.resolve();
        }
    }

    private nextRecomputingCount() {
        this.recomputingCount = ((this.recomputingCount ?? 0) % Number.MAX_SAFE_INTEGER) + 1;
        return this.recomputingCount;
    }

    /**
     * Checks if an update is needed and triggers the update if it is the case.
     */
    protected checkAndTriggerUpdate(): void {
        if (this.needsToRecompute !== false && this.automaticallyUpdate) {
            void this.updateHandler.updateValue(this);
        }
    }

    private getTriggerListener(): TriggerListener {
        if (!this.triggerListener) {
            this.triggerListener = {
                onTriggered: () => {
                    if (this.needsToRecompute !== false) {
                        this.manuallyTriggered = true;
                        return this.updateHandler.updateValue(this);
                    } else {
                        return Promise.resolve();
                    }
                }
            };
        }
        return this.triggerListener;
    }

    // -----------------------------------------------------------------------------------

    internallyUpdate(): Promise<void> {
        if (this.needsToRecompute === false || (!this.automaticallyUpdate && !this.manuallyTriggered)) {
            return this.updatedPromise();
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
            return Promise.resolve();
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
                return this.updatedPromise();
        }
    }

    private async handleAsyncUpdateWithDebounceTime(debounceTime: number): Promise<void> {
        const recomputingCount = this.nextRecomputingCount();
        await Promise.race([
            this.currentRecomputing,
            new Promise(resolve => setTimeout(() => resolve(), debounceTime))
        ]);
        return this.handleAsyncUpdate(recomputingCount, true);
    }

    private handleAsyncUpdate(recomputingCount: number, wasAlreadyProcessing: boolean): Promise<void> {
        if (recomputingCount !== this.recomputingCount) {
            Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount} is skipped (${this.recomputingCount})`);
            return this.updatedPromise();
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
            this.tellValueChangeListeners(listener => {
                if (listener.startsAsyncUpdate) {
                    listener.startsAsyncUpdate()
                }
            });
        }
        return this.updatedPromise();
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyUpdate: END ------------------------------------------------------
    // ---------------------------------------------------------------------------------------

    needsAnUpdate(notifyOthers?: boolean): void {
        Logger.trace(() => `Property.needsAnUpdate ${this.id}`);
        this.needsToRecompute = true;
        this.needsToRevalidate = true;

        // chain is controlled by RuleEngine Class, it will set notifyOthers to false
        if (notifyOthers !== false) {
            this.updateHandler.needsAnUpdate(this);
        }

        this.tellValueChangeListeners(listener => {
            if (listener.needsAnUpdate) {
                listener.needsAnUpdate()
            }
        });
    }

    hasBeenUpdated() {
        this.tellValueChangeListeners(listener => listener.updated());
    }

    errorWhileUpdating(error: any): void {
        this.updatedListeners?.forEach(ul => ul.reject(error));
        delete this.updatedListeners;
        this.tellValueChangeListeners(listener => {
            if (listener.updateFailed) {
                listener.updateFailed(error);
            }
        });
    }

    dependencyHasBeenUpdated(dependency: PropertyDependency) {
        if (dependency.options.validation) {
            this.needsToRevalidate = true;
        }
        this.tellValueChangeListeners(listener => {
            if (listener.dependencyHasBeenUpdated) {
                listener.dependencyHasBeenUpdated(dependency);
            }
        });
    }

    internallyRequiresEagerUpdate(): boolean {
        return this.valueChangeListeners.length > 0;
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyValidate  --------------------------------------------------------
    // ---------------------------------------------------------------------------------------
    
    /**
     * Used for specialised synchronous Validations like ScalarValidators
     */
    protected abstract getSpecialisedValidationResult(): ValidationMessage[];

    addValidator(validator: Validator) {
        this.validators.push(validator);
    }

    validate(): Promise<void> {
        const validated = () => this.tellValueChangeListeners(listener => {
            if (listener.validated) {
                listener.validated();
            }
        });
        const doValidate = () => {
            this.needsToRevalidate = false;
            this.isAboutToStartValidation = false;
            this.validationMessages = this.getSpecialisedValidationResult();

            if (this.validators.length) {
                this.validationCounter = ((this.validationCounter || 0) + 1) % Number.MAX_SAFE_INTEGER;
                const currentValidationCount = this.validationCounter;
                return Promise.all(this.validators.map((validator: Validator) => {
                    validator.validate().then(result => {
                        const msgs = result.getMessages(this.id);
                        if (msgs?.length && currentValidationCount === this.validationCounter) {
                            this.validationMessages.push(...msgs);
                        }
                    }, error => {
                        Logger.error('Validation failed', error);
                    })
                })).then(() => validated());
            } else {
                validated();
                return Promise.resolve();
            }
        };
        if (this.needsToRevalidate !== false && !this.isAboutToStartValidation) {
            this.isAboutToStartValidation = true;
            return this.awaitAsyncUpdate().then(() => doValidate());
        } else {
            return Promise.resolve();
        }
    }

    isValid(): boolean {
        return this.validationMessages.every(msg => msg.type.isValid);
    }

    getValidationMessages(): ValidationMessage[] {
        return this.validationMessages;
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyValidate: END ----------------------------------------------------
    // ---------------------------------------------------------------------------------------

    registerValueChangedListener(changed: ValueChangeListener): void {
        this.valueChangeListeners.push(changed);
        if (changed.needsAnUpdate && (this.needsToRecompute !== false || this.needsToRevalidate !== false)) {
            changed.needsAnUpdate();
        }
    }

    deregisterValueChangedListener(changed: ValueChangeListener): void {
        const index = this.valueChangeListeners.findIndex(cb => cb === changed);
        if (index >= 0) {
            this.valueChangeListeners.splice(index, 1);
        }
    }

    protected tellValueChangeListeners(fcn: (listener: ValueChangeListener, index: number) => void) {
        this.valueChangeListeners.forEach(fcn);
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

    isAsynchronous(): boolean {
        return this.validators.some(v => v.isAsynchronous());
    }

    backpressureConfig?: BackpressureConfig;

    abstract isProcessing(): boolean;
    abstract isReadOnly(): boolean;
    abstract exportData(): D | null;
    abstract importData(data: D | null): void;
    abstract compareData(a: D | null, b: D | null): boolean;
}
