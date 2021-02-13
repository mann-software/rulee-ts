import { AbstractDataProperty } from "./abstract-data-property";

export interface PropertyArrayListReadonly<T> extends AbstractDataProperty<T[]> {
    getElement(atIndex: number): T;
    // TODO further array methods
}

export interface PropertyArrayListReadonlyAsync<T> extends PropertyArrayListReadonly<T> {
    awaitElement(atIndex: number): Promise<T>;
    // TODO further array methods
}

export interface PropertyArrayList<T> extends PropertyArrayListReadonly<T> {
    addElement(el: T): void;
    removeElement(el: T): void;
    // TODO further array methods
}

export interface PropertyArrayListAsync<T> extends PropertyArrayListReadonlyAsync<T>, PropertyArrayList<T> {
    awaitAddingElement(el: T): Promise<void>;
    awaitRemovingElement(el: T): Promise<void>;
    // TODO further array methods
}
