import { ValueProvider } from "./value-provider";

export class ChoiceValueProvider<T> implements ValueProvider<T> {

    private value: T | null = null;

    constructor(private readonly emptyChoiceValue: T | null) { }

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        this.value = value;
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
        return false;
    }

}
