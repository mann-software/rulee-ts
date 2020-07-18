import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";
import { Logger } from "../../util/logger/logger";

export class DerivedAsyncValueProvider<T> implements ValueProvider<T> {

    private processing = false;

    constructor(
        private readonly dependencies: AbstractProperty<unknown>[],
        private readonly get: (dependencies: AbstractProperty<unknown>[]) => Promise<T | null>,
        private readonly set?: (dependencies: AbstractProperty<unknown>[], value: T | null) => void
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
            this.set(this.dependencies, value);
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
