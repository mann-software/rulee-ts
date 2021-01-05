import { AbstractPropertyImpl } from "./abstract-property-impl";
import { ListOfProperties } from "./list-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { OwnerRelation } from "../dependency-graph/dependency-graph";
import { AbstractDataProperty } from "./abstract-data-property";
import { ListIndexImpl } from "./factory/list-index-impl";
import { PropertyTemplate } from "./factory/property-template";
import { SiblingAccess } from "../provider/list-provider/sibling-access";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export class ListOfPropertiesImpl<T extends AbstractDataProperty<D>, D> extends AbstractPropertyImpl<(D | null)[]> implements ListOfProperties<T, D>, SiblingAccess<T> {

    private internalList: { prop: T; index: ListIndexImpl }[] = [];
    readonly siblingCount = this.list.length;
    private readonly selectedIndices: number[] = [];
    private nxtId = 0;

    get length() {
        return this.internalList.length;
    }

    get list() {
        return this.internalList.map(el => el.prop);
    }

    constructor(
        readonly id: string,
        private readonly propertyTemplate: PropertyTemplate<T, D>,
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
        return this.internalList[index]?.prop;
    }

    addProperty(property?: T, atIndex?: number, dontNotify?: boolean): T {
        const prop = this.addPropertyInternal(atIndex);
        if (property) {
            property.transferData(prop);
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
            const prop = this.addPropertyInternal(index);
            prop.importData(d);
            this.ownerRelation.addOwnerDependency(this, prop);
            return prop;
        });
        this.needsAnUpdate();
        return result;
    }

    private addPropertyInternal(atIndex?: number): T {
        const propId = `${this.id}_${this.nxtId}`;
        this.nxtId++;
        const idx = atIndex ?? this.internalList.length;
        const index = new ListIndexImpl(idx, this.internalList, idx => this.selectedIndices.includes(idx));
        const prop = this.propertyTemplate(propId, index, this);
        if (atIndex !== undefined) {
            this.internalList.splice(atIndex, 0, {prop, index});
            this.adjustIndices(atIndex + 1);
        } else {
            this.internalList.push({prop, index});
        }
        return prop;
    }

    private adjustIndices(start?: number, end?: number) {
        const to = end || this.internalList.length;
        for (let i = start ?? 0; i < to; i++) {
            this.internalList[i].index.index = i;
        }
    }

    updatePropertyData(data: D | null, atIndex: number): void {
        this.getProperty(atIndex)?.importData(data);
    }

    updateProperty(property: AbstractDataProperty<D>, atIndex: number): void {
        const prop = this.getProperty(atIndex);
        if (prop) {
            property.transferData(prop);
        }
    }

    swapProperties(indexA: number, indexB: number): void {
        if (indexA !== indexB) {
            this.movePropertyInternal(indexA, indexB);
            if (indexA < indexB) {
                this.movePropertyInternal(indexB - 1, indexA);
            } else {
                this.movePropertyInternal(indexB + 1, indexA);
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
        this.movePropertyInternal(fromIndex, toIndex);
        const selectedIdx = this.selectedIndices.indexOf(fromIndex);
        if (selectedIdx >= 0) {
            this.selectedIndices.splice(fromIndex, 1, toIndex);
        }
        this.needsAnUpdate();
    }

    private movePropertyInternal(from: number, to: number): void {
        if (from !== to) {
            const [prop] = this.internalList.splice(from, 1);
            if (prop) {
                this.internalList.splice(to, 0, prop);
                if (from < to) {
                    this.adjustIndices(from);
                } else {
                    this.adjustIndices(to);
                }
            }
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
        if (index >= 0 && index < this.internalList.length) {
            const [removed] = this.internalList.splice(index, 1);
            this.adjustIndices(index);
            this.needsAnUpdate();
            return removed?.prop;
        }
    }

    removeProperty(property: T): boolean {
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
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
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
        this.selectPropertyAtIndex(idx);
    }

    isPropertySelectedAtIndex(index: number): boolean {
        return this.selectedIndices.includes(index);
    }

    isPropertySelected(property: T): boolean {
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
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
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
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

    // interface: SiblingAccess

    getSibling(atIndex: number): T | undefined {
        return this.getProperty(atIndex);
    }

    someSibling(predicate: (sibling: T, index?: number) => unknown) {
        return this.internalList.some((el) => predicate(el.prop, el.index.idx));
    }

    everySibling(predicate: (sibling: T, index?: number) => unknown) {
        return this.internalList.every((el, index) => predicate(el.prop, index));
    }

    reduceSiblings<R>(callbackfn: (previousValue: R, sibling: T, index?: number) => R, initialValue: R) {
        return this.internalList.reduce<R>((res, el, i) => callbackfn(res, el.prop, i), initialValue);
    }

    filterSiblings(predicate: (sibling: T, index?: number) => unknown): T[] {
        return this.internalList.filter((el, i) => predicate(el.prop, i)).map(el => el.prop);
    }

    // ------------------
    // -- data relevant -
    // ------------------

    setToInitialState(): void {
        this.internalList = [];
    }

    exportData(): (D | null)[] {
        return this.internalList.map(prop => prop.prop.exportData());
    }

    importData(data: (D | null)[]): void {
        this.setToInitialState();
        data.forEach((entry: D | null) => {
            const prop = this.addPropertyInternal();
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
