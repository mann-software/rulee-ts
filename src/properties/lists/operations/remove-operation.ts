import { ListOperation } from "./operation";

export class RemoveOperation<T> extends ListOperation<T> {

    private removed: T | undefined;

    constructor(
        public sync: () => Promise<void>,
        private readonly index: number,
    ) {
        super(sync);
    }
    
    apply(list: T[]): void {
        const [removed] = list.splice(this.index, 1);
        this.removed = removed;
    }

    undo(list: T[]): void {
        if (this.removed) {
            list.splice(this.index, 0, this.removed);
        }
    }

}
