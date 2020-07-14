import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";

export class DerivedValueProvider<T> implements ValueProvider<T> {

    constructor(
        private dependencies: AbstractProperty<any>[],
        private get: (dependencies: AbstractProperty<any>[]) => T | null,
        private set?: (dependencies: AbstractProperty<any>[], value: T | null) => void
    ) {}

    getValue(): T | null {
        return this.get(this.dependencies);
    }

    setValue(value: T | null): void {
        if (this.set) {
            this.set(this.dependencies, value);
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
