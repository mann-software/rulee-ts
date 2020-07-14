import { AbstractProperty } from "./abstract-property";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export interface ListOfProperties<T extends AbstractProperty<D>, D> extends AbstractProperty<(D | null)[]> {

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
    addProperty(options?: { property?: T, atIndex?: number }): T;

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

    unselectPropertyAtIndex(index: number): void;
    unselectProperty(property: T): void;

}
