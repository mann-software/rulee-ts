import { AbstractProperty } from "./abstract-property";
import { GroupOfProperties } from "./group-of-properties";
import { ListOfProperties } from "./list-of-properties";
import { PropertyScalar } from "./property-scalar";

export type DataTypeAsProperty<D> =
    D extends (infer E)[] ? ListOfProperties<DataTypeAsProperty<E>, E> :
    D extends Record<string, unknown> ? GroupOfProperties<{ [K in keyof D]: DataTypeAsProperty<D[K]> }, D> :
    D extends string | number | boolean | Date ? PropertyScalar<D> :
    AbstractDataProperty<D>;

export type DataTypeOfProperty<T> = T extends AbstractDataProperty<infer D> ? D : unknown;

/**
 * Interface to import/export/synchronize data of properties
 */
export interface AbstractDataProperty<D> extends AbstractProperty {

    /**
     * Export the data, e.g. to store it somewhere
     */
    exportData(): D | null;

    /**
     * Import some external data, e.g. received from somewhere
     * Keep in mind: There are also data provider like ObjectValueProvider
     * that keep external data in sync
     * 
     * @param data external Data
     */
    importData(data: D | null): void;

    // todo: put this in extra interface and implement diff, but also implement for diff an enabled flag
    compareData(a: D | null, b: D | null): boolean;
}