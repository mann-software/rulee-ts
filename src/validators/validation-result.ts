import { ValidationMessage } from "./validation-message";

/**
 * The result of a validation.
 * 
 * - Empty array, empty object or undefined if the validation was passed.
 * - Array of ValidationMessage if the result holds for every validatedProperties of Validator
 * - Object with propertyId as keys and the corresponding messages (propertyId must be one of validatedProperties) 
 */
export type ValidationResult = undefined | ValidationMessage[] | { [propertyId: string]: ValidationMessage[] };
