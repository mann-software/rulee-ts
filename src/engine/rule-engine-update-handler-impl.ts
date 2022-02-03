import { AbstractProperty } from "../properties/abstract-property";
import { ValidationResult } from "../validators/validation-result";
import { ValidatorInstance } from "./validation/validator-instance-impl";

export interface RuleEngineUpdateHandler {
    /**
     * See: {@link RuleEngine.needsAnUpdate}
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
     * Call this to cancel ongoing validations as well as to invalidate the last validation result for the given Validator
     * @param validators validators to invalidate
     */
    cancelValidationAndInvalidateResults(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): void;
    /**
     * Validates the given validators but uses the last validation result if it is still up to date (and not invalidated via cancelValidationAndInvalidateResults)
     * @param validators validators to validate
     */
    validateValidatorInstances(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): Promise<ValidationResult | 'cancelled'>[];
}
