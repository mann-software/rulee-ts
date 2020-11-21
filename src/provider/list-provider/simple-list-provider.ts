import { ListProvider } from "./list-provider";
import { PropertyId } from "../../properties/property-id";
import { ListIndexImpl } from "../../properties/factory/list-index-impl";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { AbstractDataProperty } from "../../properties/abstract-data-property";

export class SimpleListProvider<T extends AbstractDataProperty<D>, D> implements ListProvider<T> {

    private readonly list: { prop: T; index: ListIndexImpl }[] = [];
    readonly siblingCount = this.list.length;
    private nxtId = 0;

    constructor(
        private readonly id: PropertyId,
        private readonly propertyTemplate: PropertyTemplate<T, D>,
        private readonly getSelected: (idx: number) => boolean
    ) { }

    getList(): T[] {
        return this.list.map(el => el.prop);
    }

    clearList(): void {
        this.list.splice(0, this.list.length);
    }

    addProperty(atIndex?: number): T {
        const propId = `${this.id}_${this.nxtId}`;
        this.nxtId++;
        const idx = atIndex ?? this.list.length;
        const index = new ListIndexImpl(idx, this.list, this.getSelected);
        const prop = this.propertyTemplate(propId, index, this);
        if (atIndex !== undefined) {
            this.list.splice(atIndex, 0, {prop, index});
            this.adjustIndices(atIndex + 1);
        } else {
            this.list.push({prop, index});
        }
        return prop;
    }

    getProperty(atIndex: number): T | undefined {
        return this.list[atIndex]?.prop;
    }

    removeByIndex(idx: number): T | undefined {
        if (idx < 0 || idx >= this.list.length) {
            return;
        } else {
            const [removed] = this.list.splice(idx, 1);
            this.adjustIndices(idx);
            return removed?.prop;
        }
    }

    moveProperty(from: number, to: number): void {
        if (from !== to) {
            const [prop] = this.list.splice(from, 1);
            if (prop) {
                this.list.splice(to, 0, prop);
                if (from < to) {
                    this.adjustIndices(from);
                } else {
                    this.adjustIndices(to);
                }
            }
        }
    }

    private adjustIndices(start?: number, end?: number) {
        const to = end || this.list.length;
        for (let i = start ?? 0; i < to; i++) {
            this.list[i].index.index = i;
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

    // interface: SiblingAccess

    getSibling(atIndex: number): T | undefined {
        return this.getProperty(atIndex);
    }

    someSibling(predicate: (sibling: T, index?: number) => unknown) {
        return this.list.some((el) => predicate(el.prop, el.index.idx));
    }

    everySibling(predicate: (sibling: T, index?: number) => unknown) {
        return this.list.every((el, index) => predicate(el.prop, index));
    }

    reduceSiblings<R>(callbackfn: (previousValue: R, sibling: T, index?: number) => R, initialValue: R) {
        return this.list.reduce<R>((res, el, i) => callbackfn(res, el.prop, i), initialValue);
    }

    filterSiblings(predicate: (sibling: T, index?: number) => unknown): T[] {
        return this.list.filter((el, i) => predicate(el.prop, i)).map(el => el.prop);
    }
}
