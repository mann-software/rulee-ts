import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";

export class DerivedAsyncValueProvider<T> implements ValueProvider<T> {

    private processing = false;

    constructor(
        private dependencies: AbstractProperty<any>[],
        private get: (dependencies: AbstractProperty<any>[]) => Promise<T | null>,
        private set?: (dependencies: AbstractProperty<any>[], value: T | null) => void
    ) {}

    getValue(): Promise<T | null> {
        this.processing = true;
        return this.get(this.dependencies).then(result => {
            this.processing = false;
            return Promise.resolve(result);
        }, err => {
            this.processing = false;
            return Promise.resolve(err);
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
