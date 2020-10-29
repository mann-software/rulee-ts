import { AbstractProperty } from "../properties/abstract-property";
import { ValidationResult } from "../validators/validation-result";
import { Validator } from "../validators/validator";

export interface RuleEngineUpdateHandler<D> {
    /**
     * Call this, if the property might have changed.
     * The rule engine will mark all properties that are necessary to be updated
     * @param mightHaveChanged property that might have changed
     */
    needsAnUpdate(mightHaveChanged: AbstractProperty<D>): void;
    /**
     * Call this to let the rule engine handle the update.
     * The rule engine will call internallyUpdate on all properties that 
     * need to be updated
     * @param property to update
     */
    updateValue(property: AbstractProperty<D>): Promise<void>;
    /**
     * Call this to invalidate the last validation result for the given Validator
     * @param validators validators to invalidate
     */
    invalidateValidationResults(validators: readonly Validator[]): void;
    /**
     * Validates the given validators but uses the last validation result if it is still up to date (and not invalidated via invalidateValidationResults)
     * @param validators validators to validate
     */
    validate(validators: readonly Validator[]): Promise<ValidationResult>[];
}
