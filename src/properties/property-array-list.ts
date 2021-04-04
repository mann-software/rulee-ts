import { AbstractDataProperty } from "./abstract-data-property";

export interface PropertyArrayListReadonly<T> extends AbstractDataProperty<T[]> {
    getElement(atIndex: number): T;
    getElements(): T[];
}

export interface PropertyArrayListReadonlyAsync<T> extends PropertyArrayListReadonly<T> {
    awaitElement(atIndex: number): Promise<T>;
    awaitElements(): Promise<T[]>;
}

export interface PropertyArrayListCrud<T> extends PropertyArrayListReadonly<T> {
    addElement(el: T, index?: number): void;
    updateElement(el: T, index: number): void;
    removeElement(index: number): void;
}

export interface PropertyArrayListCrudAsync<T> extends PropertyArrayListReadonlyAsync<T>, PropertyArrayListCrud<T> {
    awaitAddingElement(el: T, index?: number): Promise<void>;
    awaitUpdateElement(el: T, index: number): Promise<void>;
    awaitRemovingElement(index: number): Promise<void>;
}

export type PropertyArrayList<T> = PropertyArrayListReadonly<T> | 
    PropertyArrayListReadonlyAsync<T> |
    PropertyArrayListCrud<T> |
    PropertyArrayListCrudAsync<T>;
