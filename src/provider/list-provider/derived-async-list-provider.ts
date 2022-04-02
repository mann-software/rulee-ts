import { AbstractProperty } from "../../properties/abstract-property";
import { AsyncListProvider } from "./list-provider";

export class DerivedAsyncListProvider<T, Dependencies extends readonly AbstractProperty[]> implements AsyncListProvider<T> {

    private processing = false;

    constructor (
        private readonly dependencies: Dependencies,
        private readonly properties: (dependencies: Dependencies) => Promise<T[]>,
    ) { }

    getProperties(): Promise<T[]> {
        this.processing = true;
        return this.properties(this.dependencies).then((result) => {
            return result;
        }).finally(() => {
            this.processing = false;
        });
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
    setDataToInitialState(): void {
        this.processing = false; // TODO cancel
    }
    isAsynchronous(): boolean {
        return true;
    }
    isProcessing(): boolean {
        return this.processing;
    }
    shouldBeCached(): boolean {
        return false;
    }
    isReadOnly(): boolean {
        return true;
    }

}