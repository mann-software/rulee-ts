import { ValidationMessage } from "./validation-message";

/**
 * The result of a validation.
 * 
 * - Empty array, empty object or undefined if the validation was passed.
 * - Array of ValidationMessage if the result holds for every validated property
 * - Object with propertyId as keys and the corresponding messages (propertyId must be one of given properties) 
 */
export type ValidationResult = void | ValidationMessage[] | { [propertyId: string]: ValidationMessage[] };
