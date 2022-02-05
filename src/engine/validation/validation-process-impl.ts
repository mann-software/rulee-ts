import { ValidatorValidationResult } from "../../validators/validator-validation-result";

/**
 * Used by RuleEngine to keep track of validation for a validator
 */
export interface ValidationProcess {
    isLastResultUpToDate: boolean;
    isCancelled: boolean;
    currentValidation?: Promise<ValidatorValidationResult | 'cancelled'>;
    lastValidationResult?: ValidatorValidationResult;
}
