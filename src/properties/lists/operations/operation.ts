
export abstract class ListOperation<T> {

    constructor(
        protected sync: () => Promise<void>
    ) { }

    abstract apply(list: T[]): void;
    abstract undo(list: T[]): void;

    synchronize() {
        return this.sync();
    }
}
