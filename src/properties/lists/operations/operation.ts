
export abstract class ListOperation<T> {

    private success?: boolean;

    constructor(
        protected sync: () => Promise<void>
    ) { }

    abstract apply(list: T[]): void;
    abstract undo(list: T[]): void;

    synchronize() {
        return this.sync().then(() => {
            this.success = true;
        }, err => {
            this.success = false;
            throw err;
        });
    }

    public syncSuccessfull() {
        return this.success;
    }
}
