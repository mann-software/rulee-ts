import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";

export class DerivedAsyncValueProvider<T> implements ValueProvider<T> {

    private processing = false;

    constructor(
        private readonly dependencies: AbstractProperty<unknown>[],
        private readonly get: (dependencies: AbstractProperty<unknown>[]) => Promise<T | null>,
        private readonly set?: (dependencies: AbstractProperty<unknown>[], value: T | null) => Promise<void>
    ) {}

    getValue(): Promise<T | null> {
        this.processing = true;
        return this.get(this.dependencies).then(result => {
            this.processing = false;
            return Promise.resolve(result);
        });
    }

    setValue(value: T | null): void {
        if (this.set) {
            void this.set(this.dependencies, value);
        }
    }

    isAsynchronous(): boolean {
        return true;
    }

    isProcessing(): boolean {
        return this.processing;
    }

    shouldBeCached(): boolean {
        return true;
    }

    isReadOnly(): boolean {
        return !this.set;
    }

}
