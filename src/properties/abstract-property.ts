import { PropertyId } from "./property-id";
import { ValueChangeListener } from "./value-change-listener";
import { Trigger } from "./trigger";
import { DataLink } from "./data-link/data-link";
import { Backpressure } from "./backpressure/backpressure";
import { ValidationMessage } from "../validators/validation-message";

export interface AbstractProperty<D> extends DataLink<D> {
    readonly id: PropertyId;

    /**
     * Method to call if the property changed or even might have changed.
     * The property will be updated by the rule engine. 
     * Usually no need to call by user of ruleengine, except for this case:
     * Call the method if the value changed by not setting it via the ruleengine to
     * inform the ruleengine it has changed
     */
    needsAnUpdate(notifyOthers?: boolean): void;

    registerValueChangedListener(changed: ValueChangeListener): void;
    deregisterValueChangedListener(changed: ValueChangeListener): void;

    setUpdateStrategy(strategy: 'Automatic' | 'Manually'): void;
    addUpdateTrigger(trigger: Trigger): void;
    addUpdateTrigger(trigger: Trigger, setUpdateStrategyManually: boolean): void;
    removeUpdateTrigger(trigger: Trigger): void;

    /**
     * Triggers the validation
     */
    validate(): void;

    /**
     * Indicates that the current property has an valid state
     */
    isValid(): boolean;
    
    /**
     * Gets current Validation Messages
     */
    getValidationMessages(): ValidationMessage[];

    /**
     * Indicates that the property requires asynchronous processing
     */
    isAsynchronous(): boolean;

    /**
     * Returns the config that contains the info on how to
     * cope with backpressure.
     */
    readonly backpressureConfig: Backpressure;

    /**
     * Indicates that the property is currently processing
     */
    isProcessing(): boolean;

    /**
     * Indicates that the property is readonly
     */
    isReadOnly(): boolean;
}
