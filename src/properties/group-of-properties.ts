import { AbstractProperty } from "./abstract-property";

/**
 * Manages an ordered set of properties
 */
export interface GroupOfProperties<T extends { [id: string]: AbstractProperty<unknown> }, D> extends AbstractProperty<D> {
    readonly properties: T;
    readonly propertiesAsList: readonly AbstractProperty<unknown>[];
}
