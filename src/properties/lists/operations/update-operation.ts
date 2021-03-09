import { ListOperation } from "./operation";

export class UpdateOperation<T> implements ListOperation<T> {

    private old: T | undefined;

    constructor(
        public sync: Promise<void> | void,
        private readonly update: T,
        private readonly index: number,
    ) {}
    
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
