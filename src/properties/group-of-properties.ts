import { AbstractProperty } from "./abstract-property";
import { AbstractDataProperty, DataTypeAsProperty } from "./abstract-data-property";

export type GroupedProperties<D> =  { [K in keyof D]: DataTypeAsProperty<D[K]> }

/**
 * Manages an ordered set of properties
 */
export interface GroupOfProperties<T extends { [id: string]: AbstractProperty }, D> extends AbstractDataProperty<D> {
    readonly properties: T;
    readonly propertiesAsList: readonly AbstractProperty[];
}
