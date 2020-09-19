import { Choice } from "../../../properties/choice";
import { PropertyScalar } from "../../../properties/property-scalar";
import { ValueProvider } from "../value-provider";

export class PropertySourceChoicesProvider<T> implements ValueProvider<T> {

    private value: T | null;

    constructor(
        private readonly choicesSource: PropertyScalar<Choice<T>[]>,
        private readonly emptyChoice?: Choice<T>
    ) {
        this.value = emptyChoice?.value ?? null;
    }

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        this.value = value;
    }

    getChoices() {
        const choices = this.choicesSource.getValue();
        if (this.emptyChoice) {
            return choices ? [this.emptyChoice, ...choices] : [this.emptyChoice];
        }
        return choices ?? [];
    }

    isAsynchronous(): boolean {
        return this.choicesSource.isAsynchronous();
    }

    isProcessing(): boolean {
        return this.choicesSource.isProcessing();
    }

    shouldBeCached(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return false;
    }

}
