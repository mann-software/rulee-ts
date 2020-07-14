import { AttributeId } from "./attribute-id";
import { AbstractProperty } from "../properties/abstract-property";

/**
 * Attributes are additional state information that can be derived from the values
 * 
 * E.g. Mandatory
 */
export interface Attribute<A> {
    readonly id: AttributeId<A>;
    readonly dependencies: AbstractProperty<any>[];
    getValue(): A;
}
