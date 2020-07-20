import { AbstractPropertyImpl } from "./abstract-property-impl";
import { ListOfProperties } from "./list-of-properties";
import { AbstractProperty } from "./abstract-property";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";
import { ListProvider } from "../provider/list-provider/list-provider";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export class ListOfPropertiesImpl<T extends AbstractProperty<D>, D> extends AbstractPropertyImpl<(D | null)[]> implements ListOfProperties<T, D> {
    
    
    constructor(
        readonly id: string,
        private readonly listProvider: ListProvider<T, D>,
        private selectedIndices: number[],
        private readonly isMultiSelect: boolean = false,
        updateHandler: RuleEngineUpdateHandler<(D | null)[]>,
    ) {
        super(updateHandler);
    }

    internallyInit(): void {
        super.internallyInit();
        throw new Error("Method not implemented.");
    }   
    
    protected internallySyncUpdate(): void {
        throw new Error("Method not implemented.");
    }

    protected internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void } {
        throw new Error("Method not implemented.");
    }

    protected getSpecialisedValidationResult() {
        return [];
    }

    addProperty(options?: { property?: T; atIndex?: number }): T {
        const prop = this.listProvider.addProperty(options?.atIndex);
        if (options?.property) {
            prop.importData(options.property.exportData());
            prop.needsAnUpdate();
        }
        return prop;
    }

    removePropertyAtIndex(index: number): T | undefined {
        return this.listProvider.removeByIndex(index);
    }

    removeProperty(property: T): boolean {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        return idx >= 0 && this.removePropertyAtIndex(idx) !== undefined;
    }
    
    selectPropertyAtIndex(index: number): void {
        if (this.isMultiSelect) {
            if (!this.selectedIndices.includes(index)) {
                this.selectedIndices.push(index);
            }
        } else {
            this.selectedIndices = [index];
        }
    }

    selectProperty(property: T): void {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        this.selectPropertyAtIndex(idx);
    }
    
    unselectPropertyAtIndex(index: number): void {
        const idxOfIndex = this.selectedIndices.findIndex(selected => selected === index);
        if (idxOfIndex >= 0) {
            this.selectedIndices.splice(idxOfIndex, 1);
        }
    }

    unselectProperty(property: T): void {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        this.unselectPropertyAtIndex(idx);
    }

    isValid(): boolean {
        return super.isValid() && true; // TODO
    }

    isProcessing(): boolean {
        return false; // TODO
    }

    isReadOnly(): boolean {
        return false; // TODO
    }

    isAsynchronous(): boolean {
        return false; // TODO
    }
    

    // ------------------
    // -- data relevant -
    // ------------------

    exportData(): (D | null)[] {
        return this.listProvider.getList().map(prop => prop.exportData());
    }

    importData(data: (D | null)[]): void {
        this.listProvider.clearList();
        data.forEach((entry: D | null) => {
            const prop = this.listProvider.addProperty();
            prop.importData(entry);
        });
        this.needsAnUpdate();
    }

    compareData(a: (D | null)[], b: (D | null)[]): boolean {
        return true; // TODO
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
