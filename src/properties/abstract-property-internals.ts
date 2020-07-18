import { AbstractProperty } from "./abstract-property";
import { ValueChangeListener } from "./value-change-listener";
import { Trigger, TriggerListener } from "./trigger";
import { BackpressureType } from "./backpressure/backpressure-type";
import { Logger } from "../util/logger/logger";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";
import { ValidationMessage } from "../validators/validation-message";
import { Validator } from "../validators/validator";
import { PropertyDependency } from "../dependency-graph/property-dependency";

export interface AbstractPropertyWithInternals<D> extends AbstractProperty<D> {
    internallyInit(): void;
    internallyUpdate(): Promise<void>;
    hasBeenUpdated(): void;
    dependencyHasBeenUpdated(dependency: PropertyDependency): void;
    internallyRequiresEagerUpdate(): boolean;
}

export abstract class AbstractPropertyImpl<D> implements AbstractPropertyWithInternals<D> {

    private automaticallyUpdate = true;
    private manuallyTriggered?: boolean;
    private triggerListener?: TriggerListener;

    private needsToRecompute?: boolean;
    private recomputingCount?: number;
    private currentRecomputing?: Promise<void>;

    private needsToRevalidate?: boolean;
    private isAboutToStartValidation?: boolean;
    private validationCounter?: number;
    private readonly validators: Validator[] = [];
    private validationMessages: ValidationMessage[] = [];


    constructor(
        protected updateHandler: RuleEngineUpdateHandler<D>
    ) { }

    private readonly valueChangeListeners: ValueChangeListener[] = [];

    abstract id: string;

    internallyInit(): void {
        this.needsToRecompute = true;
        this.needsToRevalidate = true;
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
    protected awaitAsyncUpdate(): Promise<void> {
        if (this.needsToRecompute && this.automaticallyUpdate) {
            return this.updateHandler.updateValue(this);
        } else if (this.currentRecomputing) {
            return this.currentRecomputing;
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Checks if an update needs to be triggered
     */
    protected checkUpdate(): void {
        if (this.needsToRecompute && this.automaticallyUpdate) {
            void this.updateHandler.updateValue(this);
        }
    }

    private getTriggerListener(): TriggerListener {
        if (!this.triggerListener) {
            this.triggerListener = {
                onTriggered: () => {
                    if (this.needsToRecompute) {
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
        if (this.needsToRecompute === undefined) {
            throw new Error(`The rule ${this.id} has not been initialised. Please call the method create() of your RuleEngineBuilder`);
        }
        if (!this.needsToRecompute || (!this.automaticallyUpdate && !this.manuallyTriggered)) {
            return this.currentRecomputing ?? Promise.resolve();
        }
        this.needsToRecompute = false;
        delete this.manuallyTriggered;
        if (this.isAsynchronous()) {
            const count = ((this.recomputingCount ?? 0) % Number.MAX_SAFE_INTEGER) + 1;
            this.recomputingCount = count;
            if (this.currentRecomputing) {
                return this.handleBackpressure(count, this.currentRecomputing);
            } else {
                return this.handleAsyncUpdate(count, false);
            }
        } else {
            this.internallySyncUpdate();
            return Promise.resolve();
        }
    }

    private handleBackpressure(recomputingCount: number, currentRecomputing: Promise<void>): Promise<void> {
        switch (this.backpressureConfig.type) {
            case 'switch' as BackpressureType:
                if (this.backpressureConfig.debounceTime) {
                    return this.handleAsyncUpdateWithDebounceTime(recomputingCount, currentRecomputing);
                } else {
                    return this.handleAsyncUpdate(recomputingCount, true);
                }
            case 'exhaust' as BackpressureType:
                return currentRecomputing.then(() => this.handleAsyncUpdate(recomputingCount, true));
            case 'skip' as BackpressureType:
            default:
                return currentRecomputing;
        }
    }

    private handleAsyncUpdateWithDebounceTime(recomputingCount: number, currentRecomputing: Promise<void>): Promise<void> {
        const updateIfFirst = () => {
            if (this.recomputingCount === recomputingCount) {
                this.recomputingCount++;
                return this.handleAsyncUpdate(this.recomputingCount, true);
            } else {
                return Promise.resolve();
            }
        };
        if (this.backpressureConfig.debounceTime) {
            setTimeout(() => {
                void updateIfFirst()
            }, this.backpressureConfig.debounceTime);
        }
        return currentRecomputing.then(() => updateIfFirst());
    }

    private handleAsyncUpdate(recomputingCount: number, wasAlreadyProcessing: boolean): Promise<void> {
        if (recomputingCount !== this.recomputingCount) {
            Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount} is skipped (${this.recomputingCount})`);
            return this.currentRecomputing ?? Promise.resolve();
        }
        Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount}`);
        const update = this.internallyAsyncUpdate<unknown>();
        this.currentRecomputing = update.asyncPromise.then((value) => {
            Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: ${recomputingCount} / ${this.recomputingCount}`);
            if (recomputingCount === this.recomputingCount) {
                update.resolve(value);
                this.currentRecomputing = undefined;
                Logger.trace(() => `Property.handleAsyncUpdate ${this.id}: updated`);
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
        return this.currentRecomputing;
    }
    
    // ---------------------------------------------------------------------------------------
    // -- handing internallyUpdate: END ------------------------------------------------------
    // ---------------------------------------------------------------------------------------

    needsAnUpdate(notifyOthers?: boolean): void {
        Logger.trace(() => `Property.needsAnUpdate ${this.id}`);
        this.needsToRecompute = true;
        this.needsToRevalidate = true;
        this.tellValueChangeListeners(listener => {
            if (listener.needsAnUpdate) {
                listener.needsAnUpdate()
            }
        });
        // chain is controlled by RuleEngine Class, it will set notifyOthers to false
        if (notifyOthers !== false) {
            this.updateHandler.needsAnUpdate(this);
        }
    }

    hasBeenUpdated() {
        this.tellValueChangeListeners(listener => listener.updated());
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

    validate(): void {
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
        if (this.needsToRevalidate && !this.isAboutToStartValidation) {
            this.isAboutToStartValidation = true;
            void this.awaitAsyncUpdate().then(() => doValidate());
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

    readonly backpressureConfig = { debounceTime: 40, type: 'switch' as BackpressureType };

    abstract isProcessing(): boolean;
    abstract isReadOnly(): boolean;
    abstract exportData(): D | null;
    abstract importData(data: D | null): void;
    abstract compareData(a: D | null, b: D | null): boolean;
}
