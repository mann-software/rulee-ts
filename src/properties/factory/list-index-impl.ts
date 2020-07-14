import { ListIndex } from "./list-index";

export class ListIndexImpl implements ListIndex {

    constructor(public index: number, private list: any[], private getSelected: (idx: number) => boolean) { }

    idx(): number {
        return this.index;
    }

    isFirst(): boolean {
        return this.index === 0;
    }

    isLast(): boolean {
        return this.index + 1 === this.list.length;
    }

    isSelected() {
        return this.getSelected(this.index);
    }
}
