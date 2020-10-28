import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";

export class DerivedValueProvider<T, Dependencies extends readonly AbstractProperty<unknown>[]> implements ValueProvider<T> {

    constructor(
        private readonly dependencies: Dependencies,
        private readonly get: (dependencies: Dependencies) => T | null,
        private readonly set?: (value: T | null, ...dependencies: Dependencies) => void
    ) {}

    getValue(): T | null {
        return this.get(this.dependencies);
    }

    setValue(value: T | null): void {
        if (this.set) {
            this.set(value, ...this.dependencies);
        }
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
        return !this.set;
    }

}
