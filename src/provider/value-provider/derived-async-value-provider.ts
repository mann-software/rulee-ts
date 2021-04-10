import { ValueProvider } from "./value-provider";
import { AbstractProperty } from "../../properties/abstract-property";

export class DerivedAsyncValueProvider<T, Dependencies extends readonly AbstractProperty[]> implements ValueProvider<T> {

    private processing = false;

    constructor(
        private readonly dependencies: Dependencies,
        private readonly get: (dependencies: Dependencies) => Promise<T | null>,
        private readonly set?: (value: T | null, ...dependencies: Dependencies) => Promise<void>
    ) {}

    getValue(): Promise<T | null> {
        this.processing = true;
        return this.get(this.dependencies).then(result => {
            return result;
        }).finally(() => {
            this.processing = false;
        });
    }

    setValue(value: T | null): Promise<void> | void {
        if (this.set) {
            return this.set(value, ...this.dependencies);
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
