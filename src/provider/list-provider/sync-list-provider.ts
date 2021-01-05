
/**
 * This interface offers the typical CRUD methods that are used
 * by asynchronous versions of ListOfProperties.
 * It can be implemented e.g. by REST-Api Calls.
 */
export interface SyncListProvider<D> {
    addProperty(propertyData: D, index?: number): Promise<void>;
    fetchProperties(): Promise<D[]>;
    updateProperty(propertyData: D, index: number): Promise<void>;
    removeProperty(propertyData: D, index: number): Promise<void>;
}
