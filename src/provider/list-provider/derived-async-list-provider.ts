import { AbstractProperty } from "../../properties/abstract-property";
import { ListProvider } from "./list-provider";


export class DerivedAsyncListProvider<T, Dependencies extends readonly AbstractProperty[]> implements ListProvider<T> {

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
    addProperty(propertyData: T, index?: number): void {
        // no-op
    }
    updateProperty(propertyData: T, index: number): void {
        // no-op
    }
    removeProperty(index: number): void {
        // no-op
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