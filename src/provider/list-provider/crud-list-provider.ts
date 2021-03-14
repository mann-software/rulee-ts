import { AbstractProperty } from "../../properties/abstract-property";
import { ListProvider } from "./list-provider";


export class CrudListProvider<T, Dependencies extends readonly AbstractProperty[]> implements ListProvider<T> {

    private resource?: T[];

    constructor (
        private readonly dependencies: Dependencies,
        private readonly resourceProvider: (dependencies: Dependencies) => T[],
    ) { }

    getProperties(): T[] {
        this.resource = this.resourceProvider(this.dependencies);
        return this.resource;
    }
    addProperty(propertyData: T, index?: number): void {
        if (this.resource) {
            if (index) {
                this.resource.splice(index, 0, propertyData);
            } else {
                this.resource.push(propertyData);
            }
        }
    }
    updateProperty(propertyData: T, index: number): void {
        if (this.resource) {
            this.resource.splice(index, 1, propertyData);
        }
    }
    removeProperty(index: number): void {
        if (this.resource) {
            this.resource.splice(index, 1);
        }
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
        return false;
    }

}