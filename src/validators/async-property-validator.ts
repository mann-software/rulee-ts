import { AbstractDataProperty } from "../properties/abstract-data-property";
import { AbstractProperty } from "../properties/abstract-property";
import { GroupOfProperties, PropertyGroup } from "../properties/group-of-properties";
import { ListOfProperties } from "../properties/list-of-properties";
import { PropertyArrayList } from "../properties/property-array-list";
import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";

/**
 * Asynchronously validates a single property
 * 
 * Analog to {@link PropertyValidator} but returns a promise
 */
export type AsyncPropertyValidator<T extends AbstractDataProperty<unknown>, Dependencies extends readonly AbstractProperty[]> = (property: T, ...dependencies: Dependencies) => Promise<ValidationMessage | void>;

/**
 * Shortcut for AsyncPropertyValidator<PropertyScalar<T>>. See {@link AsyncPropertyValidator}
 */
export type AsyncPropertyScalarValidator<T, Dependencies extends readonly AbstractProperty[]> = AsyncPropertyValidator<PropertyScalar<T>, Dependencies>;

/**
 * Shortcut for AsyncPropertyValidator<GroupOfProperties<T>>. See {@link AsyncPropertyValidator}
 */
export type AsyncGroupOfPropertiesValidator<T extends PropertyGroup, Dependencies extends readonly AbstractProperty[]> = AsyncPropertyValidator<GroupOfProperties<T>, Dependencies>;

/**
 * Shortcut for AsyncPropertyValidator<PropertyArrayList<T>>. See {@link AsyncPropertyValidator}
 */
export type AsyncPropertyArrayListValidator<T, Dependencies extends readonly AbstractProperty[]> = AsyncPropertyValidator<PropertyArrayList<T>, Dependencies>;

/**
 * Shortcut for AsyncPropertyValidator<ListOfProperties<T, D>>. See {@link AsyncPropertyValidator}
 */
export type AsyncListOfPropertiesValidator<T extends AbstractDataProperty<D>, D, Dependencies extends readonly AbstractProperty[]> = AsyncPropertyValidator<ListOfProperties<T, D>, Dependencies>;
