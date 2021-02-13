import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { ListProvider } from "../provider/list-provider/list-provider";
import { ValidationMessage } from "../validators/validation-message";
import { AbstractPropertyImpl } from "./abstract-property-impl";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { PropertyArrayListAsync } from "./property-array-list";
import { PropertyId } from "./property-id";

export class PropertyArrayListImpl<T> extends AbstractPropertyImpl<T[]> implements PropertyArrayListAsync<T> {

    constructor(
        readonly id: PropertyId,
        private readonly listProvider: ListProvider<T[]>,
        updateHandler: RuleEngineUpdateHandler,
        backpressureConfig?: BackpressureConfig,
    ) {
        super(updateHandler, backpressureConfig);
    }
    awaitAddingElement(el: T): Promise<void> {
        throw new Error("Method not implemented.");
    }
    awaitRemovingElement(el: T): Promise<void> {
        throw new Error("Method not implemented.");
    }
    awaitElement(atIndex: number): Promise<T> {
        throw new Error("Method not implemented.");
    }
    getElement(atIndex: number): T {
        throw new Error("Method not implemented.");
    }
    addElement(el: T): void {
        throw new Error("Method not implemented.");
    }
    removeElement(el: T): void {
        throw new Error("Method not implemented.");
    }
    
    protected internallySyncUpdate(): void {
        throw new Error("Method not implemented.");
    }
    protected internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void } {
        throw new Error("Method not implemented.");
    }
    protected getSpecialisedValidationResult(): ValidationMessage[] {
        throw new Error("Method not implemented.");
    }

    isAsynchronous(): boolean {
        throw new Error("Method not implemented.");
    }
    isProcessing(): boolean {
        throw new Error("Method not implemented.");
    }
    isReadOnly(): boolean {
        throw new Error("Method not implemented.");
    }

    setToInitialState(): void {
        throw new Error("Method not implemented.");
    }

    exportData(): T[] | null {
        throw new Error("Method not implemented.");
    }
    importData(data: T[] | null): void {
        throw new Error("Method not implemented.");
    }
    compareData(a: T[] | null, b: T[] | null): boolean {
        throw new Error("Method not implemented.");
    }
}
