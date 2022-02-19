import { AbstractProperty } from "./abstract-property";
import { AbstractDataProperty, DataTypeOfProperty } from "./abstract-data-property";

export interface PropertyGroup { 
    [id: string]: AbstractDataProperty<unknown>;
}

export type PropertyGroupData<T> = {[K in keyof T]: DataTypeOfProperty<T[K]>};

/**
 * Manages an ordered set of properties
 */
export interface GroupOfProperties<T extends PropertyGroup> extends AbstractDataProperty<PropertyGroupData<T>> {
    readonly properties: T;
    readonly propertiesAsList: readonly AbstractProperty[];
}
