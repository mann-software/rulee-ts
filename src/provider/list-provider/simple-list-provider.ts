import { ListProvider } from "./list-provider";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyId } from "../../properties/property-id";
import { ListIndexImpl } from "../../properties/factory/list-index-impl";
import { PropertyTemplate } from "../../properties/factory/property-template";

export class SimpleListProvider<T extends AbstractProperty<D>, D> implements ListProvider<T, D> {

    private readonly list: { prop: T; index: ListIndexImpl }[] = [];
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

    addProperty(): T {
        const propId = `${this.id}_${this.nxtId}`;
        this.nxtId++;
        const index = new ListIndexImpl(this.list.length, this.list, this.getSelected);
        const prop = this.propertyTemplate(propId, index);
        this.list.push({prop, index});
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
}
