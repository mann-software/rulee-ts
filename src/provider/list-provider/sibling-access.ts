import { AbstractProperty } from "../../properties/abstract-property";

/**
 * Interface that can be used for list elements to access their siblings
 */
export interface SiblingAccess<T extends AbstractProperty> {
    readonly siblingCount: number;
    getSibling(atIndex: number): T | undefined;
    someSibling(predicate: (sibling: T, index?: number) => unknown): boolean;
    everySibling(predicate: (sibling: T, index?: number) => unknown): boolean;
    reduceSiblings<R>(callbackfn: (previousValue: R, sibling: T, index?: number) => R, initialValue: R): R;
    filterSiblings(predicate: (sibling: T, index?: number) => unknown): T[];
}
