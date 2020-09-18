import { ValueProvider } from "../value-provider";

export class ChoiceValueProvider<T> implements ValueProvider<T> {

    private value: T | null;

    constructor(emptyChoiceValue?: T | null) {
        this.value = emptyChoiceValue ?? null;
    }

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
