import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { AsyncListProvider, ListProvider } from "../provider/list-provider/list-provider";
import { AbstractPropertyImpl, AbstractPropertyWithInternals } from "./abstract-property-impl";
import { BackpressureConfig } from "./backpressure/backpressure-config";
import { AddOperation } from "./lists/operations/add-operation";
import { ListOperation } from "./lists/operations/operation";
import { RemoveOperation } from "./lists/operations/remove-operation";
import { UpdateOperation } from "./lists/operations/update-operation";
import { PropertyArrayListCrud, PropertyArrayListCrudAsync, PropertyArrayListReadonly } from "./property-array-list";
import { PropertyId } from "./property-id";

export abstract class PropertyArrayListImpl<T> extends AbstractPropertyImpl<T[]> implements PropertyArrayListReadonly<T> {
    
    protected workingList: T[] = [];
    
    setToInitialState(): void {
        this.needsAnUpdate(false);
    }
    
    get length() {
        return this.getElements().length;
    }
    
    abstract getElements(): T[];
    abstract getElement(atIndex: number): T | undefined;

    exportData(): T[] | null {
        return this.workingList;
    }

    importData(data: T[] | null): void {
        this.workingList = data ?? [];
    }
}

export class PropertyArrayListSyncImpl<T> extends PropertyArrayListImpl<T> implements PropertyArrayListCrud<T> {

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

    getElement(atIndex: number): T | undefined {
        this.syncUpdateIfNeeded();
        return this.workingList[atIndex];
    }

    addElement(el: T, index?: number): void {
        this.listProvider.addProperty(el, index);
        this.needsAnUpdate(true, false, true);
    }

    updateElement(el: T, index: number): void {
        this.listProvider.updateProperty(el, index);
        this.needsAnUpdate(true, false, true);
    }

    removeElement(index: number): void {
        this.listProvider.removeProperty(index);
        this.needsAnUpdate(true, false, true);
    }
    
    protected internallySyncUpdate(): void {
        this.workingList = this.listProvider.getProperties();
    }

    protected internallyAsyncUpdate(): { asyncPromise: Promise<any>; resolve: (value: any) => void } {
        return {
            asyncPromise: Promise.resolve(),
            resolve: () => ({})
        }
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
}

export class PropertyArrayListAsyncImpl<T> extends PropertyArrayListImpl<T> implements PropertyArrayListCrudAsync<T> {

    private operationPipe: ListOperation<T>[] = [];
    private awaitUpdateBeforeApply?: boolean;
    private syncPromise?: Promise<void>;

    constructor(
        readonly id: PropertyId,
        private readonly listProvider: AsyncListProvider<T>,
        updateHandler: RuleEngineUpdateHandler,
        backpressureConfig?: BackpressureConfig,
    ) {
        super(updateHandler, backpressureConfig);
    }

    getElements(): T[] {
        return this.workingList;
    }
    async awaitElements(): Promise<T[]> {
        await this.syncList();
        return this.getElements();
    }

    getElement(atIndex: number): T | undefined {
        return this.workingList[atIndex];
    }
    async awaitElement(atIndex: number): Promise<T | undefined> {
        await this.syncList();
        return this.getElement(atIndex);
    }

    addElement(el: T, index?: number): void {
        void this.awaitAddingElement(el, index);
    }
    async awaitAddingElement(el: T, index?: number): Promise<void> {
        const op = new AddOperation<T>(() => this.listProvider.addProperty(el, index), el, index);
        return this.pushOperation(op);
    }

    updateElement(el: T, index: number): void {
        void this.awaitUpdateElement(el, index);
    }
    async awaitUpdateElement(el: T, index: number): Promise<void> {
        const op = new UpdateOperation<T>(() => this.listProvider.updateProperty(el, index), el, index);
        return this.pushOperation(op);
    }

    removeElement(index: number): void {
        void this.awaitRemovingElement(index);
    }
    async awaitRemovingElement(index: number): Promise<void> {
        const op = new RemoveOperation<T>(() => this.listProvider.removeProperty(index), index);
        return this.pushOperation(op);
    }

    private async pushOperation(operation: ListOperation<T>) {
        this.operationPipe.push(operation);
        try {
            const updated = this.awaitAsyncUpdate();
            if (updated) {
                this.awaitUpdateBeforeApply = true;
                await updated;
                if (this.awaitUpdateBeforeApply) {
                    delete this.awaitUpdateBeforeApply;
                    this.operationPipe.forEach(op => op.apply(this.workingList));
                }
            } else {
                operation.apply(this.workingList); // maybe add strategies later (e.g. only apply after sync)
            }
            super.needsAnUpdate(true, false, true);
        } catch (err) {
            delete this.awaitUpdateBeforeApply;
            this.errorWhileUpdating(err);
        }
        return this.syncList();
    }

    private syncList(): Promise<void> {
        if (!this.syncPromise) {
            this.syncPromise = this.createSyncPromise().finally(() => {
                this.syncPromise = undefined;
            });
        }
        return this.syncPromise;   
    }
    
    private async createSyncPromise() {
        let operation: ListOperation<T> | undefined;
        try {
            await this.awaitAsyncUpdate();
            operation = this.operationPipe.shift();
            while (operation !== undefined) {
                await operation.synchronize();
                operation = this.operationPipe.shift();
            }
        } catch (err) {
            for (let i = this.operationPipe.length - 1; i >= 0; i--) {
                this.operationPipe[i].undo(this.workingList);
            }
            operation?.undo(this.workingList);
            this.operationPipe = [];
            super.needsAnUpdate(true, false, true);
            this.errorWhileUpdating(err);
        }
    }
    
    protected internallySyncUpdate(): void {
        // no-op
    }

    protected internallyAsyncUpdate(): { asyncPromise: Promise<any>; resolve: (value: any) => void } {
        this.workingList = [];
        return {
            asyncPromise: this.listProvider.getProperties(),
            resolve: (list: T[]) => {
                this.workingList = list;
            }
        }
    }

    isAsynchronous(): boolean {
        return this.listProvider.isAsynchronous();
    }
    isProcessing(): boolean {
        return this.listProvider.isProcessing() || !!this.syncPromise;
    }
    isReadOnly(): boolean {
        return this.listProvider.isReadOnly();
    }
    
    needsAnUpdate(notifyOthers?: boolean) {
        this.operationPipe = [];
        this.workingList = [];
        super.needsAnUpdate(notifyOthers);
    }
}
