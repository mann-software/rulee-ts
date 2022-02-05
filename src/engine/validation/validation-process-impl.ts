import { CrossValidationResult } from "../../validators/cross-validation-result";

/**
 * Used by RuleEngine to keep track of validation for a validator
 */
export interface ValidationProcess {
    isLastResultUpToDate: boolean;
    isCancelled: boolean;
    currentValidation?: Promise<CrossValidationResult | 'cancelled'>;
    lastValidationResult?: CrossValidationResult;
}
