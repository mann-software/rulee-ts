import { GroupOfProperties, PropertyGroup } from "../index";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { ListOfProperties } from "../properties/list-of-properties";
import { PropertyArrayList } from "../properties/property-array-list";
import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";

/**
 * Synchronously validates a single property
 * 
 * Return void/undefined if the property is valid with no message to issue.
 * Designed to return one message. You can associate more PropertyValidator's
 * to one property if there are different validations that lead to more
 * than one message at once
 */
export type PropertyValidator<T extends AbstractDataProperty<unknown>> = (property: T) => ValidationMessage | void;

/**
 * Shortcut for PropertyValidator<PropertyScalar<T>>. See {@link PropertyValidator}
 */
export type PropertyScalarValidator<T> = PropertyValidator<PropertyScalar<T>>;

/**
 * Shortcut for PropertyValidator<GroupOfProperties<T>>. See {@link PropertyValidator}
 */
export type GroupOfPropertiesValidator<T extends PropertyGroup> = PropertyValidator<GroupOfProperties<T>>;

/**
 * Shortcut for PropertyValidator<PropertyArrayList<T>>. See {@link PropertyValidator}
 */
export type PropertyArrayListValidator<T> = PropertyValidator<PropertyArrayList<T>>;

/**
 * Shortcut for PropertyValidator<ListOfProperties<T, D>>. See {@link PropertyValidator}
 */
export type ListOfPropertiesValidator<T extends AbstractDataProperty<D>, D> = PropertyValidator<ListOfProperties<T, D>>;
