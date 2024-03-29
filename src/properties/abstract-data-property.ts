import { AbstractProperty } from "./abstract-property";
import { GroupOfProperties } from "./group-of-properties";
import { ListOfProperties } from "./list-of-properties";
import { PropertyScalar } from "./property-scalar";

export type DataTypeToPropertyGroup<D extends Record<string, unknown>> = { [K in keyof D]: DataTypeAsProperty<D[K]> };

export type DataTypeAsProperty<D> =
    D extends (infer E)[] ? ListOfProperties<DataTypeAsProperty<E>, E> :
    D extends Record<string, unknown> ? GroupOfProperties<{ [K in keyof D]: DataTypeAsProperty<D[K]> }> :
    D extends boolean ? PropertyScalar<boolean> :
    D extends string ? PropertyScalar<D> :
    D extends number ? PropertyScalar<D> :
    D extends Date ? PropertyScalar<Date> :
    AbstractDataProperty<D>;

export type DataTypeOfProperty<T> = T extends AbstractDataProperty<infer D> ? D : unknown;

/**
 * Extends the interface AbstractProperty with methods to import/export/synchronize data of properties
 */
export interface AbstractDataProperty<D> extends AbstractProperty {

    /**
     * (Re)sets the data to the initial state
     */
    setToInitialState(): void;

    /**
     * Export the data, e.g. to store it somewhere
     */
    exportData(): D | null;

    /**
     * Import some external data, e.g. received from somewhere.
     * As an alternative keep in mind that there are also data provider like ObjectValueProvider
     * that keep external data in sync
     * 
     * @param data external Data
     */
    importData(data: D | null): void;

    /**
     * Transfers the data from this to the other property
     * @param toProperty other property
     */
    transferData(toProperty: AbstractDataProperty<D>): void;
}
