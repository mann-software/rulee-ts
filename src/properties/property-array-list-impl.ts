import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { ListProvider } from "../provider/list-provider/list-provider";
import { ValidationMessage } from "../validators/validation-message";
import { AbstractPropertyImpl } from "./abstract-property-impl";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { AddOperation } from "./lists/operations/add-operation";
import { ListOperation } from "./lists/operations/operation";
import { RemoveOperation } from "./lists/operations/remove-opertaion";
import { UpdateOperation } from "./lists/operations/update-operation";
import { PropertyArrayListCrudAsync } from "./property-array-list";
import { PropertyId } from "./property-id";

export class PropertyArrayListImpl<T> extends AbstractPropertyImpl<T[]> implements PropertyArrayListCrudAsync<T> {

    private workingList: T[] = [];
    private operationPipe: ListOperation<T>[] = [];

    constructor(
        readonly id: PropertyId,
        private readonly listProvider: ListProvider<T>,
        updateHandler: RuleEngineUpdateHandler,
        backpressureConfig?: BackpressureConfig,
    ) {
        super(updateHandler, backpressureConfig);
    }

    getElements(): T[] {
        this.syncUpdateIfNeeded();
        return this.workingList;
    }
    async awaitElements(): Promise<T[]> {
        await this.syncList();
        return this.getElements();
    }

    getElement(atIndex: number): T {
        this.syncUpdateIfNeeded();
        return this.workingList[atIndex];
    }
    async awaitElement(atIndex: number): Promise<T> {
        await this.syncList();
        return this.getElement(atIndex);
    }

    addElement(el: T, index?: number): void {
        const op = new AddOperation<T>(this.listProvider.addProperty(el, index), el, index);
        this.operationPipe.push(op);
        this.needsAnUpdate();
    }
    async awaitAddingElement(el: T, index?: number): Promise<void> {
        this.addElement(el, index);
        return this.syncList();
    }

    updateElement(el: T, index: number): void {
        const op = new UpdateOperation<T>(this.listProvider.updateProperty(el, index), el, index);
        this.operationPipe.push(op);
        this.needsAnUpdate();
    }
    async awaitUpdateElement(el: T, index: number): Promise<void> {
        this.updateElement(el, index);
        return this.syncList();
    }

    removeElement(index: number): void {
        const op = new RemoveOperation<T>(this.listProvider.removeProperty(index), index);
        this.operationPipe.push(op);
        this.needsAnUpdate();
    }
    async awaitRemovingElement(index: number): Promise<void> {
        this.removeElement(index);
        return this.syncList();
    }

    private async syncList(): Promise<void> {
        await this.awaitAsyncUpdate();
        if (this.isAsynchronous()) {
            let operation: ListOperation<T> | undefined;
            operation = this.operationPipe.shift();
            while (operation !== undefined) {
                await operation.sync;
                operation = this.operationPipe.shift();
            }
        } else {
            this.operationPipe.forEach(op => op.apply(this.workingList));
        }
        // TODO tell value change listeners
    }
    
    protected internallySyncUpdate(): void {
        this.workingList = this.listProvider.getProperties() as T[];
    }

    protected internallyAsyncUpdate(): { asyncPromise: Promise<any>; resolve: (value: any) => void } {
        this.workingList = [];
        return {
            asyncPromise: this.listProvider.getProperties() as Promise<T[]>,
            resolve: (list: T[]) => {
                this.workingList = list;
            }
        }
    }

    protected getSpecialisedValidationResult(): ValidationMessage[] {
        throw new Error("Method not implemented.");
    }

    isAsynchronous(): boolean {
        return this.listProvider.isAsynchronous();
    }
    isProcessing(): boolean {
        return this.listProvider.isProcessing();
    }
    isReadOnly(): boolean {
        return this.listProvider.isReadOnly();
    }

    setToInitialState(): void {
        this.operationPipe = [];
        this.needsAnUpdate(false);
    }

    exportData(): T[] | null {
        return this.workingList;
    }
    importData(data: T[] | null): void {
        this.workingList === data;
    }
    compareData(a: T[] | null, b: T[] | null, compareFcn?: (a: T, b: T) => boolean): boolean {
        if (!compareFcn) {
            compareFcn = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
        }
        if (a == null || b == null) {
            return a === b;
        }
        return a.length === b.length && a.every((val, i) => compareFcn!(val, b[i]));
    }
}
