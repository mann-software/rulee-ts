import { Provider } from "../provider";

/**
 * This interface offers the typical CRUD methods that are used
 * by asynchronous versions of ListOfProperties.
 * It can be implemented e.g. by REST-Api Calls.
 */
export interface ListProvider<D> extends Provider {
    getProperties(): Promise<D[]>;
    addProperty(propertyData: D, index?: number): Promise<void>;
    updateProperty(propertyData: D, index: number): Promise<void>;
    removeProperty(index: number): Promise<void>;
}
