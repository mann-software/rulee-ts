import { AbstractProperty } from "../../properties/abstract-property";
import { SiblingAccess } from "./sibling-access";

export interface ListProvider<T extends AbstractProperty> extends SiblingAccess<T> {
    /**
     * Get the list
     * If isAsynchronous() returns true, a promise is expected as result, otherwise no promise is expected
     */
    getList(): T[];

    /**
     * after clearing the list is empty. Supported if not read-only
     */
    clearList(): void;

    /**
     * Adds a new property and returns that property. The property will be added  at the end of the list
     * if no value is provided for atIndex
     * Supported if not read-only
     * @param property given property
     * @param atIndex optional index
     */
    addProperty(atIndex?: number): T;

    /**
     * Return the property at given index
     * @param atIndex index
     */
    getProperty(atIndex: number): T | undefined;

    /**
     * Removes the property with the given index. Supported if not read-only.
     * Returns the property that was removed
     * @param idx
     */
    removeByIndex(idx: number): T | undefined;

    /**
     * Move property from index to index
     * @param from from index
     * @param to to index
     */
    moveProperty(from: number, to: number): void;

    /**
     * Indicates that geting the list requires asynchronous processing.
     */
    isAsynchronous(): boolean;
    /**
     * Indicates that the list is currently asynchronously processed
     */
    isProcessing(): boolean;
    /**
     * Indicates, that the list should be cached or needs to be/better be recomputed every time.
     * If set to true, the value is fetched only after a dependency has changed.
     * If set to false, the value is fetched on every request.
     */
    shouldBeCached(): boolean;
    /**
     * Indicates that changing the list is not allowed
     */
    isReadOnly(): boolean;
}
