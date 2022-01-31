import { ValidationMessagesMap } from "./validation-messages-map";
import { ValidationMessage } from "./validation-message";

/**
 * The result of a validation.
 * 
 * - Empty array, empty object or undefined if the validation was passed.
 * - Array of ValidationMessage if the result holds for every validated property
 * - Map with propertyId as keys and the corresponding messages (propertyId must be one of given properties) 
 */
export type ValidationResult = void | ValidationMessage[] | ValidationMessagesMap;
