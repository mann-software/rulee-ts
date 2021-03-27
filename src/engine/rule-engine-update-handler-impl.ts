import { AbstractProperty } from "../properties/abstract-property";
import { AbstractPropertyWithInternals } from "../properties/abstract-property-impl";
import { ValidationResult } from "../validators/validation-result";
import { ValidatorInstance } from "./validation/validator-instance-impl";

export interface RuleEngineUpdateHandler {
    /**
     * Call this, if the property might have changed.
     * The rule engine will mark all properties that are necessary to be updated
     * @param mightHaveChanged property that might have changed
     */
    needsAnUpdate(mightHaveChanged: AbstractProperty): void;
    /**
     * Call this to let the rule engine handle the update.
     * The rule engine will call internallyUpdate on all properties that 
     * need to be updated
     * @param property to update
     */
    updateValue(property: AbstractProperty): Promise<void> | undefined;
    /**
     * Notify other properties that depend on the value of the updated property.
     *
     * Note: Here all dependencies except a value dependency are relevant. E.g. visibility, validation, etc.
     *
     * @param property updated property
     */
    hasBeenUpdated(property: AbstractPropertyWithInternals<unknown>): void;
    /**
     * Call this to invalidate the last validation result for the given Validator
     * @param validators validators to invalidate
     */
    invalidateValidationResults(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): void;
    /**
     * Validates the given validators but uses the last validation result if it is still up to date (and not invalidated via invalidateValidationResults)
     * @param validators validators to validate
     */
    validate(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): Promise<ValidationResult>[];
}
