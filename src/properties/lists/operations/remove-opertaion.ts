import { ListOperation } from "./operation";

export class RemoveOperation<T> implements ListOperation<T> {

    private removed: T | undefined;

    constructor(
        public sync: Promise<void> | void,
        private readonly index: number,
    ) {}
    
    apply(list: T[]): void {
        const [removed] = list.splice(this.index);
        this.removed = removed;
    }

    undo(list: T[]): void {
        if (this.removed) {
            list.splice(this.index, 0, this.removed);
        }
    }

}
