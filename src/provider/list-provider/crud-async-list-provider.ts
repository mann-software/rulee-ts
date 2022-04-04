import { AbstractProperty } from "../../properties/abstract-property";
import { AsyncListProvider } from "./list-provider";


export class CrudAsyncListProvider<T, Dependencies extends readonly AbstractProperty[]> implements AsyncListProvider<T> {

    private processing = 0;

    constructor (
        private readonly dependencies: Dependencies,
        private readonly create: (propertyData: T, index?: number) => Promise<void>,
        private readonly read: (dependencies: Dependencies) => Promise<T[]>,
        private readonly update: (propertyData: T, index: number) => Promise<void>,
        private readonly remove: (index: number) => Promise<void>, // aka delete
    ) { }

    getProperties(): Promise<T[]> {
        this.processing++;
        return this.read(this.dependencies).then((result) => {
            return result;
        }).finally(() => {
            this.processing--;
        });
    }
    addProperty(propertyData: T, index?: number): Promise<void> {
        this.processing++;
        return this.create(propertyData, index).finally(() => {
            this.processing--;
        });
    }
    updateProperty(propertyData: T, index: number): Promise<void> {
        this.processing++;
        return this.update(propertyData, index).finally(() => {
            this.processing--;
        });
    }
    removeProperty(index: number): Promise<void> {
        this.processing++;
        return this.remove(index).finally(() => {
            this.processing--;
        });
    }
    setDataToInitialState(): void {
        // TODO cancel
    }
    isAsynchronous(): boolean {
        return true;
    }
    isProcessing(): boolean {
        return this.processing > 0;
    }
    shouldBeCached(): boolean {
        return false;
    }
    isReadOnly(): boolean {
        return false;
    }

}