import { ListOperation } from "./operation";

export class UpdateOperation<T> extends ListOperation<T> {

    private old: T | undefined;

    constructor(
        public sync: () => Promise<void>,
        private readonly update: T,
        private readonly index: number,
    ) {
        super(sync);
    }
    
    apply(list: T[]): void {
        const [old] = list.splice(this.index, 1, this.update);
        this.old = old;
    }

    undo(list: T[]): void {
        if (this.old) {
            list.splice(this.index, 1, this.old);
        }
    }

}
