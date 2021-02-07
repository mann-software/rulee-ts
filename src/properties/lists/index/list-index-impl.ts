import { ListIndex } from "./list-index";

export class ListIndexImpl implements ListIndex {
    
    private selected?: boolean;

    constructor(public idx: number, private readonly list: unknown[]) { }

    get isSelected() {
        return this.selected ?? false;
    }

    set isSelected(value: boolean) {
        this.selected = value;
    }

    isFirst(): boolean {
        return this.idx === 0;
    }

    isLast(): boolean {
        return this.idx + 1 === this.list.length;
    }
}
