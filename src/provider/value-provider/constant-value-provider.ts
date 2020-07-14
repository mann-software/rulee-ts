import { ValueProvider } from "./value-provider";

export class ConstantValueProvider<T> implements ValueProvider<T> {

    constructor(private value: T | null) {}

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        // no-op
    }

    isAsynchronous(): boolean {
        return false;
    }

    isProcessing(): boolean {
        return false;
    }

    shouldBeCached(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return true;
    }

}
