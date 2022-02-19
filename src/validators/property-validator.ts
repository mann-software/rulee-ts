import { AbstractDataProperty } from "../properties/abstract-data-property";
import { AbstractProperty } from "../properties/abstract-property";
import { GroupOfProperties, PropertyGroup } from "../properties/group-of-properties";
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
export type PropertyValidator<T extends AbstractDataProperty<unknown>, Dependencies extends readonly AbstractProperty[]> = (property: T, ...dependencies: Dependencies) => ValidationMessage | void;

/**
 * Shortcut for PropertyValidator<PropertyScalar<T>>. See {@link PropertyValidator}
 */
export type PropertyScalarValidator<T, Dependencies extends readonly AbstractProperty[]> = PropertyValidator<PropertyScalar<T>, Dependencies>;

/**
 * Shortcut for PropertyValidator<GroupOfProperties<T>>. See {@link PropertyValidator}
 */
export type GroupOfPropertiesValidator<T extends PropertyGroup, Dependencies extends readonly AbstractProperty[]> = PropertyValidator<GroupOfProperties<T>, Dependencies>;

/**
 * Shortcut for PropertyValidator<PropertyArrayList<T>>. See {@link PropertyValidator}
 */
export type PropertyArrayListValidator<T, Dependencies extends readonly AbstractProperty[]> = PropertyValidator<PropertyArrayList<T>, Dependencies>;

/**
 * Shortcut for PropertyValidator<ListOfProperties<T, D>>. See {@link PropertyValidator}
 */
export type ListOfPropertiesValidator<T extends AbstractDataProperty<D>, D, Dependencies extends readonly AbstractProperty[]> = PropertyValidator<ListOfProperties<T, D>, Dependencies>;
