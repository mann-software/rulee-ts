import { ValidationResult } from "../../validators/validation-result";

/**
 * Used by RuleEngine to keep track of validation for a validator
 */
export interface ValidationProcess {
    isLastResultUpToDate: boolean;
    isCancelled: boolean;
    currentValidation?: Promise<ValidationResult | 'cancelled'>;
    lastValidationResult?: ValidationResult;
}
