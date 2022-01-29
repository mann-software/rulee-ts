import { AbstractDataProperty } from "../properties/abstract-data-property";
import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";

/**
 * Common validator with its own speialized validator interface.
 * 
 * Synchronously validates a single property
 * 
 * Return undefined if the property is valid with no message to issue.
 * Designed to return one message. You can associate more SinglePropertyValidator's
 * to one property if there are different validations that lead to more
 * than one message at once
 */
export type SinglePropertyValidator<T extends AbstractDataProperty<unknown>> = (property: T) => ValidationMessage | void;

/**
 * Shortcut for SinglePropertyValidator<PropertyScalar<T>>
 */
export type PropertyScalarValidator<T> = SinglePropertyValidator<PropertyScalar<T>>
