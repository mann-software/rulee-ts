import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";

/**
 * Most common Validator with its own speialized validator interface.
 * 
 * Synchronously validates a single PropertyScalar
 * 
 * Return undefined if the property is valid with no message to issue.
 * Designed to return one message. You can associate more ScalarValidator's
 * to one PropertyScalar if there are different validations that lead to more
 * than one message at once
 */
export type ScalarValidator<T> = (property: PropertyScalar<T>) => ValidationMessage | undefined;
