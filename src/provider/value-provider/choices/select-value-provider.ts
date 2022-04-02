import { Choice } from "../../../properties/choice";
import { PropertyArrayListReadonly } from "../../../properties/property-array-list";
import { ValueProvider } from "../value-provider";

export class SelectValueProvider<T, S extends PropertyArrayListReadonly<Choice<T>>> implements ValueProvider<T> {

    private value: T | null;

    constructor(
        private readonly choicesSource: S,
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
        const choices = this.choicesSource.getElements();
        if (this.emptyChoice) {
            return choices.length ? [this.emptyChoice, ...choices] : [this.emptyChoice];
        }
        return choices;
    }

    isAsynchronous(): boolean {
        return false; // choices may be asynchronous, but value retrieval is not
    }

    isProcessing(): boolean {
        return this.choicesSource.isProcessing();
    }

    setDataToInitialState(): void {
        this.choicesSource.setToInitialState();
    }

    shouldBeCached(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return false;
    }

}
