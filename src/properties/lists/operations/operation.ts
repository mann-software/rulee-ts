
export interface ListOperation<T> {
    sync: Promise<void> | void;
    apply(list: T[]): void;
    undo(list: T[]): void;
}
