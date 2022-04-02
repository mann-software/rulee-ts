import { ValueProvider } from "./value-provider";

export class ConstantValueProvider<T> implements ValueProvider<T> {

    constructor(private readonly value: T | null) {}

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        // no-op
    }

    isAsynchronous(): boolean {
        return false;
    }

    setDataToInitialState(): void {
        // No-Op
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
