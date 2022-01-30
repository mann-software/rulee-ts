import { GroupOfProperties, PropertyGroup } from "../index";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { ListOfProperties } from "../properties/list-of-properties";
import { PropertyArrayList } from "../properties/property-array-list";
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
export type PropertyScalarValidator<T> = SinglePropertyValidator<PropertyScalar<T>>;

/**
 * Shortcut for SinglePropertyValidator<GroupOfProperties<T>>
 */
export type GroupOfPropertiesValidator<T extends PropertyGroup> = SinglePropertyValidator<GroupOfProperties<T>>;

/**
 * Shortcut for SinglePropertyValidator<PropertyArrayList<T>>
 */
export type PropertyArrayListValidator<T> = SinglePropertyValidator<PropertyArrayList<T>>;

/**
 * Shortcut for SinglePropertyValidator<ListOfProperties<T, D>>
 */
export type ListOfPropertiesValidator<T extends AbstractDataProperty<D>, D> = SinglePropertyValidator<ListOfProperties<T, D>>;
