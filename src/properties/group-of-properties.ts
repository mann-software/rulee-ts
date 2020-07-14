import { AbstractProperty } from "./abstract-property";
import { GroupAggregator } from "../provider/aggregator/group-aggregator";

/**
 * Manages an ordered set of properties
 */
export interface GroupOfProperties<T extends { [id: string]: AbstractProperty<any> }, A extends { [id: string]: GroupAggregator<any> }, D> extends AbstractProperty<D> {
    readonly properties: T;
    readonly aggregations: A;
    propertiesAsList(): AbstractProperty<any>[];
}
