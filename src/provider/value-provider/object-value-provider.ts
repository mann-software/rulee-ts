import { ValueProvider } from "./value-provider";

export class ObjectValueProvider<O, T> implements ValueProvider<T> {

    constructor(
        private obj: O, 
        private get: (obj: O) => T | null, 
        private set: (obj: O, val: T | null) => void
    ) { }

    getValue(): T | null {
        return this.get(this.obj);
    }

    setValue(value: T | null): void {
        this.set(this.obj, value);
    }

    isAsynchronous(): boolean {
        return false;
    }

    isProcessing(): boolean {
        return false;
    }

    shouldBeCached(): boolean {
        return true;
    }

    isReadOnly(): boolean {
        return false;
    }

}
