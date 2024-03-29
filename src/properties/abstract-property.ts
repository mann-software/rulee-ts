import { PropertyId } from "./property-id";
import { ValueChangeListener, ValueChangeListenerReference } from "./value-change-listener";
import { Trigger } from "./trigger";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { ValidationMessage } from "../validators/validation-message";
import { AttributeId } from "../attributes/attribute-id";
import { ValidationResult } from "../validators/validation-result";

export interface AbstractProperty {
    readonly id: PropertyId;

    /**
     * Method to call if the property changed or even might have changed.
     * The property will be updated by the rule engine.
     * Usually no need to call this method for the user of ruleengine, except for this case:
     * Call the method if the value changed by not setting it via the ruleengine to
     * inform the ruleengine it has changed
     */
    needsAnUpdate(notifyOthers?: boolean): void;

    registerValueChangedListener(changed: ValueChangeListener): ValueChangeListenerReference;
    deregisterValueChangedListener(changed?: ValueChangeListenerReference): void;

    setUpdateStrategy(strategy: 'Automatic' | 'Manually'): void;
    addUpdateTrigger(trigger: Trigger): void;
    addUpdateTrigger(trigger: Trigger, setUpdateStrategyManually: boolean): void;
    removeUpdateTrigger(trigger: Trigger): void;

    /**
     * Set flag to indicate that the user has touched this property. Might be useful for binding a property to an 
     * input component of the view layer
     * @param touched is touched
     */
    setTouched(touched: boolean): void;

    /**
     * Set flag to indicate that the user has touched this field. Default value is false
     */
    isTouched(): boolean;

    /**
     * Gets the label for this Property. If no label was defined, then the
     * id is returned
     */
    getLabel(): string;

    /**
     * Get the value of the custom Attribute. Return undefined,
     * if the value for the attribute was not defined
     * @param id AttributeId
     */
    get<A>(id: AttributeId<A>): A | undefined;

    /**
     * Returns the visibility of this property. The default is true.
     */
    isVisible(): boolean;

    /**
     * Triggers the validation
     */
    validate(): Promise<ValidationMessage[]>;

    /**
     * Validates recursively the owned properties and the property itself
     */
    validateRecursively(): Promise<ValidationResult>;

    /**
     * Indicates that the current property has an valid state
     */
    isValid(): boolean;

    /**
     * Sets validation messages and overrides the latest messages that were determined by {@link validate}.
     * In most cases you should not use this method but {@link validate} to update the validation messages.
     */
    setValidationMessages(messages: ValidationMessage[]): void;

    /**
     * Gets the validation messages of most recent validation (triggered by {@link validate}) or the messages that were set via {@link setValidationMessages}
     */
    getValidationMessages(): ValidationMessage[];

    /**
     * Clears the validation messages ({@link getValidationMessages}) and this property is regarded as valid ({@link isValid}).
     * Ongoing validations are cancelled as well.
     */
    clearValidationResult(): void;

    /**
     * Indicates that the property requires asynchronous processing
     */
    isAsynchronous(): boolean;

    /**
     * The config that defines how to cope with backpressure.
     * The default config object of the rule builder is frozen,
     * but you can set another config object.
     *
     * Defined iff property is asynchronous
     */
    backpressureConfig?: BackpressureConfig;

    /**
     * Indicates that the property is currently processing
     */
    isProcessing(): boolean;

    /**
     * Indicates that the property is readonly
     */
    isReadOnly(): boolean;
}
