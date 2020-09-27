import { AbstractPropertyImpl } from "./abstract-property-impl";
import { ListOfProperties } from "./list-of-properties";
import { AbstractProperty } from "./abstract-property";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";
import { ListProvider } from "../provider/list-provider/list-provider";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export class ListOfPropertiesImpl<T extends AbstractProperty<D>, D> extends AbstractPropertyImpl<(D | null)[]> implements ListOfProperties<T, D> {

    get length() {
        return this.listProvider.getList().length;
    }

    constructor(
        readonly id: string,
        private readonly listProvider: ListProvider<T, D>,
        private readonly selectedIndices: number[],
        private readonly isMultiSelect: boolean = false,
        updateHandler: RuleEngineUpdateHandler<(D | null)[]>,
    ) {
        super(updateHandler);
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

    getProperty(index: number): T | undefined {
        return this.listProvider.getProperty(index);
    }

    addProperty(options?: { property?: T; atIndex?: number }): T {
        const prop = this.listProvider.addProperty(options?.atIndex);
        if (options?.property) {
            prop.importData(options.property.exportData());
            prop.needsAnUpdate();
        }
        return prop;
    }

    addProperties(count: number, atIndex?: number): T[] {
        const res: T[] = [];
        for (let c = 0; c < count; c++) {
            res.push(this.addProperty({ atIndex }));
        }
        return res;
    }

    swapProperties(indexA: number, indexB: number): void {
        if (indexA !== indexB) {
            this.listProvider.moveProperty(indexA, indexB);
            if (indexA < indexB) {
                this.listProvider.moveProperty(indexB - 1, indexA);
            } else {
                this.listProvider.moveProperty(indexB + 1, indexA);
            }
            const aIdx = this.selectedIndices.indexOf(indexA);
            const bIdx = this.selectedIndices.indexOf(indexB);
            if (aIdx >= 0) {
                if (bIdx === -1) {
                    this.selectedIndices.splice(aIdx, 1, indexB);
                }
            } else if (bIdx >= 0) {
                this.selectedIndices.splice(bIdx, 1, indexA);
            }
        }
    }

    moveProperty(fromIndex: number, toIndex: number): void {
        this.listProvider.moveProperty(fromIndex, toIndex);
        const selectedIdx = this.selectedIndices.indexOf(fromIndex);
        if (selectedIdx >= 0) {
            this.selectedIndices.splice(fromIndex, 1, toIndex);
        }
    }

    removePropertyAtIndex(index: number): T | undefined {
        const idx = this.selectedIndices.indexOf(index);
        if (idx >= 0) {
            this.selectedIndices.splice(idx, 1);
            for (let i = 0; i < this.selectedIndices.length; i++) {
                const selected = this.selectedIndices[i];
                if (selected > index) {
                    this.selectedIndices.splice(i, 1, selected - 1);
                }

            }
        }
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
            this.selectedIndices.splice(0, this.selectProperty.length, index);
        }
    }

    selectProperty(property: T): void {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        this.selectPropertyAtIndex(idx);
    }

    isPropertySelectedAtIndex(index: number): boolean {
        return this.selectedIndices.includes(index);
    }

    isPropertySelected(property: T): boolean {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        return this.isPropertySelectedAtIndex(idx);
    }

    getSelectedIndices(): number[] {
        return [...this.selectedIndices];
    }

    getSelectedProperties(): { property: T; index: number }[] {
        return this.selectedIndices.map(index =>
            ({ index, property: this.getProperty(index)!})
        );
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

    unselectAll(): void {
        this.selectedIndices.splice(0, this.selectedIndices.length);
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
