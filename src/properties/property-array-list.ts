import { AbstractDataProperty } from "./abstract-data-property";

export interface PropertyArrayListReadonly<T> extends AbstractDataProperty<T[]> {
    getElement(atIndex: number): T;
    // TODO further array methods
    compareData(a: T[] | null, b: T[] | null, compareFcn?: (a: T, b: T) => boolean): boolean;
}

export interface PropertyArrayListReadonlyAsync<T> extends PropertyArrayListReadonly<T> {
    awaitElement(atIndex: number): Promise<T>;
    // TODO further array methods
}

export interface PropertyArrayList<T> extends PropertyArrayListReadonly<T> {
    addElement(el: T, index?: number): void;
    removeElement(index: number): void;
    // TODO further array methods
}

export interface PropertyArrayListAsync<T> extends PropertyArrayListReadonlyAsync<T>, PropertyArrayList<T> {
    awaitAddingElement(el: T, index?: number): Promise<void>;
    awaitRemovingElement(index: number): Promise<void>;
    // TODO further array methods
}
