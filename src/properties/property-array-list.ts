import { PropertyScalar } from "./property-scalar";

export interface PropertyArrayList<T> extends PropertyScalar<T[]> {
    addElement(el: T): void;
    removeElement(el: T): void;
    // TODO further array methods
}
