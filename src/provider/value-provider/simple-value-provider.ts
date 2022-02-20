import { ValueProvider } from "./value-provider";

export class SimpleValueProvider<T> implements ValueProvider<T> {

    private value: T | null = null;

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        this.value = value;
    }

    isAsynchronous(): boolean {
        return false;
    }

    cancelProcessing(): void {
        // No-Op
    }

    isProcessing(): boolean {
        return false;
    }

    shouldBeCached(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return false;
    }

}
