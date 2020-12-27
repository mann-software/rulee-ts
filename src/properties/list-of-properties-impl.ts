import { AbstractPropertyImpl } from "./abstract-property-impl";
import { ListOfProperties } from "./list-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { ListProvider } from "../provider/list-provider/list-provider";
import { OwnerRelation } from "../dependency-graph/dependency-graph";
import { AbstractDataProperty } from "./abstract-data-property";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export class ListOfPropertiesImpl<T extends AbstractDataProperty<D>, D> extends AbstractPropertyImpl<(D | null)[]> implements ListOfProperties<T, D> {

    get length() {
        return this.listProvider.getList().length;
    }

    get list() {
        return this.listProvider.getList();
    }

    constructor(
        readonly id: string,
        private readonly listProvider: ListProvider<T>,
        private readonly selectedIndices: number[],
        private readonly isMultiSelect: boolean = false,
        updateHandler: RuleEngineUpdateHandler,
        private readonly ownerRelation: OwnerRelation,
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

    addProperty(property?: T, atIndex?: number, dontNotify?: boolean): T {
        const prop = this.listProvider.addProperty(atIndex);
        if (property) {
            prop.importData(property.exportData());
        }
        this.ownerRelation.addOwnerDependency(this, prop);
        if (!dontNotify) {
            this.needsAnUpdate();
        }
        return prop;
    }

    addProperties(properties: number | T[], atIndex?: number): T[] {
        const res: T[] = [];
        const count = typeof properties === 'number' ? properties : properties.length;
        for (let c = 0; c < count; c++) {
            const property = typeof properties === 'number' ? undefined : properties[c];
            res.push(this.addProperty(property, atIndex, true));
        }
        this.needsAnUpdate();
        return res;
    }

    addPropertyData(data: (D | null)[], atIndex?: number): T[] {
        const result = data.map((d, i) => {
            const index = atIndex !== undefined ? atIndex + i : undefined;
            const prop = this.listProvider.addProperty(index);
            prop.importData(d);
            this.ownerRelation.addOwnerDependency(this, prop);
            return prop;
        });
        this.needsAnUpdate();
        return result;
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
            this.needsAnUpdate();
        }
    }

    moveProperty(fromIndex: number, toIndex: number): void {
        this.listProvider.moveProperty(fromIndex, toIndex);
        const selectedIdx = this.selectedIndices.indexOf(fromIndex);
        if (selectedIdx >= 0) {
            this.selectedIndices.splice(fromIndex, 1, toIndex);
        }
        this.needsAnUpdate();
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
        const result = this.listProvider.removeByIndex(index);
        if (result) {
            this.needsAnUpdate();
        }
        return result;
    }

    removeProperty(property: T): boolean {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        return idx >= 0 && this.removePropertyAtIndex(idx) !== undefined;
    }

    selectPropertyAtIndex(index: number): void {
        if (this.isMultiSelect) {
            if (!this.selectedIndices.includes(index)) {
                this.selectedIndices.push(index);
                this.needsAnUpdate();
            }
        } else {
            this.selectedIndices.splice(0, this.selectProperty.length, index);
            this.needsAnUpdate();
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

    getSelectedProperty(): { property: T; index: number } | undefined {
        const firstSelected = this.selectedIndices[0];
        if (firstSelected !== undefined) {
            return ({ index: firstSelected, property: this.getProperty(firstSelected)!});
        }
    }

    unselectPropertyAtIndex(index: number): void {
        const idxOfIndex = this.selectedIndices.findIndex(selected => selected === index);
        if (idxOfIndex >= 0) {
            this.selectedIndices.splice(idxOfIndex, 1);
            this.needsAnUpdate();
        }
    }

    unselectProperty(property: T): void {
        const idx = this.listProvider.getList().findIndex(el => el.id === property.id);
        this.unselectPropertyAtIndex(idx);
    }

    unselectAll(): void {
        this.selectedIndices.splice(0, this.selectedIndices.length);
        this.needsAnUpdate();
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

    setToInitialState(): void {
        if (!this.isReadOnly()) {
            this.listProvider.clearList();
        } else {
            this.listProvider.getList().forEach(prop => prop.setToInitialState());
        }
    }

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
