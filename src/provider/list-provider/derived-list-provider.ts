import { AbstractProperty } from "../../properties/abstract-property";
import { ListProvider } from "./list-provider";


export class DerivedListProvider<T, Dependencies extends readonly AbstractProperty[]> implements ListProvider<T> {

    constructor (
        private readonly dependencies: Dependencies,
        private readonly properties: (dependencies: Dependencies) => T[],
    ) { }

    getProperties(): T[] {
        return this.properties(this.dependencies);
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