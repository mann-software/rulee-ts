import { AbstractPropertyImpl } from "./abstract-property-impl";
import { ListOfProperties } from "./list-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { OwnerRelation } from "../dependency-graph/dependency-graph";
import { AbstractDataProperty } from "./abstract-data-property";
import { ListIndexImpl } from "./lists/index/list-index-impl";
import { PropertyTemplate } from "./factory/property-template";
import { SiblingAccess } from "../provider/list-provider/sibling-access";
import { SingleSelection } from "./lists/selection/single-selection";

/**
 * Manages a list of properties. Can be ProperyScalar, PropertyGroup or PropertyList
 */
export class ListOfPropertiesImpl<T extends AbstractDataProperty<D>, D> extends AbstractPropertyImpl<(D | null)[]> implements ListOfProperties<T, D>, SiblingAccess<T> {

    private internalList: { prop: T; index: ListIndexImpl }[] = [];
    readonly siblingCount = this.list.length;
    private readonly singleSelection?: SingleSelection;
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
        private readonly isMultiSelect: boolean,
        updateHandler: RuleEngineUpdateHandler,
        private readonly ownerRelation: OwnerRelation,
    ) {
        super(updateHandler);
        if (!isMultiSelect) {
            this.singleSelection = new SingleSelection();
        }
    }

    protected internallySyncUpdate(): void {
        throw new Error("Method not implemented.");
    }

    protected internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void } {
        throw new Error("Method not implemented.");
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
        const index = new ListIndexImpl(idx, this.internalList);
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
            this.internalList[i].index.idx = i;
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
            this.singleSelection?.swapProperties(indexA, indexB);
            this.needsAnUpdate();
        }
    }

    moveProperty(fromIndex: number, toIndex: number): void {
        this.movePropertyInternal(fromIndex, toIndex);
        this.singleSelection?.moveProperty(fromIndex, toIndex);
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
        this.singleSelection?.removePropertyAtIndex(index);
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
        if (this.internalList[index]) {
            this.internalList[index].index.isSelected = true;
        }
        if (this.singleSelection) {
            this.singleSelection.idx = index;
        }
        this.needsAnUpdate();
    }

    selectProperty(property: T): void {
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
        this.selectPropertyAtIndex(idx);
    }

    isPropertySelectedAtIndex(index: number): boolean {
        if (this.isMultiSelect) {
            return this.internalList[index]?.index.isSelected ?? false;
        } else {
            return this.singleSelection?.idx === index
        }
    }

    isPropertySelected(property: T): boolean {
        const idx = this.internalList.findIndex(el => el.prop.id === property.id);
        return this.isPropertySelectedAtIndex(idx);
    }

    getSelectedIndices(): number[] {
        if (this.isMultiSelect) {
            return this.internalList.filter(p => p.index.isSelected).map(p => p.index.idx);
        } else {
            return this.singleSelection?.idx ? [this.singleSelection?.idx] : [];
        }
    }

    getSelectedProperties(): { property: T; index: number }[] {
        if (this.isMultiSelect) {
            return this.internalList.filter(p => p.index.isSelected).map(p => ({ property: p.prop, index: p.index.idx }));
        } else {
            const p = this.getSelectedProperty();
            return p ? [p] : [];
        }
    }

    getSelectedProperty(): { property: T; index: number } | undefined {
        let prop: { prop: T; index: ListIndexImpl } | undefined;
        if (this.isMultiSelect) {
            prop = this.internalList.find(p => p.index.isSelected);
        } else if (this.singleSelection?.idx !== undefined) {
            prop = this.internalList[this.singleSelection.idx];
        }
        return prop && { property: prop.prop, index: prop.index.idx };
    }

    unselectPropertyAtIndex(index: number): void {
        this.internalList[index].index.isSelected = false;
        if (this.singleSelection?.idx === index) {
            this.singleSelection.idx = undefined;
        }
        this.needsAnUpdate();
    }

    unselectProperty(property: T | undefined): void {
        if (property !== undefined) {
            const idx = this.internalList.findIndex(el => el.prop.id === property.id);
            this.unselectPropertyAtIndex(idx);
        }
    }

    unselectAll(): void {
        if (this.isMultiSelect) {
            this.internalList.forEach(el => el.index.isSelected = false);
            this.needsAnUpdate();
        } else if (this.singleSelection?.idx) {
            this.unselectPropertyAtIndex(this.singleSelection.idx);
        }
    }

    isProcessing(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return false;
    }

    isAsynchronous(): boolean {
        return false;
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

    // ------------------
    // -- data relevant: end
    // ------------------
    
}
