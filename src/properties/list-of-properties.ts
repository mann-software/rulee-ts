import { AbstractProperty } from "./abstract-property";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export interface ListOfProperties<T extends AbstractProperty<D>, D> extends AbstractProperty<(D | null)[]> {

    /**
     * Number of properties in list
     */
    readonly length: number;

    readonly list: T[];

    /**
     * Get Property at index, posiblly undefined if there index is out of range
     * @param index index
     */
    getProperty(index: number): T | undefined;

    /**
     * Creates a new property that is added to the list and returns
     * that freshly created property.
     *
     * If a property is provided as argument, the data will be automatically transfered
     * to the freshly created property. If you want to synchronize the give property and
     * the freshly created property, you can use the function linkPropertyData of the ruleengine.
     *
     * If no atIndex is provided as argument, the property will be added at the end of the list
     *
     * @param property property whose data will be added
     * @param atIndex optional index
     */
    addProperty(property?: T, atIndex?: number): T;

    /**
     * Instantiates properties and adds them to the list
     * @param properties number of properties to create, or properties whose data will be added
     * @param atIndex optionally provide an index
     */
    addProperties(properties: number | T[], atIndex?: number): T[];

    /**
     * Instantiates properties and adds them to the list
     * @param data the data for the freshly created properties
     * @param atIndex optionally provide an index
     */
    addPropertyData(data: (D | null)[], atIndex?: number): T[];

    /**
     * Swaps the position of two properties
     * @param indexA property at index A
     * @param indexB property at index B
     */
    swapProperties(indexA: number, indexB: number): void;

    /**
     * Moves the property from one index to another index
     * @param fromIndex from
     * @param toIndex to
     */
    moveProperty(fromIndex: number, toIndex: number): void;

    /**
     * Removes the property with the given index. Supported if not read-only.
     * Returns the property that was removed
     * @param prop
     */
    removePropertyAtIndex(index: number): T | undefined;

    /**
     * Removes a property and returns true iff prop was found, thus removed. Supported if not read-only
     * @param prop
     */
    removeProperty(property: T): boolean;

    selectPropertyAtIndex(index: number): void;
    selectProperty(property: T): void;

    isPropertySelectedAtIndex(index: number): boolean;
    isPropertySelected(property: T): boolean;

    getSelectedIndices(): number[];
    getSelectedProperties(): { property: T; index: number }[];

    unselectPropertyAtIndex(index: number): void;
    unselectProperty(property: T): void;
    unselectAll(): void;

}
