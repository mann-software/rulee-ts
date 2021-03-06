import { ListProvider } from "./list-provider";


export class ReadonlyListProvider<T> implements ListProvider<T> {

    constructor (
        private readonly properties: () => T[],
    ) { }

    getProperties(): Promise<T[]> {
        return Promise.resolve(this.properties());
    }
    addProperty(propertyData: T, index?: number): Promise<void> {
        return Promise.resolve();
    }
    updateProperty(propertyData: T, index: number): Promise<void> {
        return Promise.resolve();
    }
    removeProperty(index: number): Promise<void> {
        return Promise.resolve();
    }
    isAsynchronous(): boolean {
        return false;
    }
    isProcessing(): boolean {
        return false;
    }
    shouldBeCached(): boolean {
        return false;
    }
    isReadOnly(): boolean {
        return true;
    }

}