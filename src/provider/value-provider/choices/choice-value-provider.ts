import { Choice } from "../../../properties/choice";
import { ValueProvider } from "../value-provider";

export class ChoiceValueProvider<T> implements ValueProvider<T> {

    private value: T | null;
    private readonly choiceList: Choice<T>[];

    constructor(choices: Choice<T>[], emptyChoice?: Choice<T>) {
        this.value = emptyChoice?.value ?? null;
        this.choiceList = emptyChoice ? [emptyChoice, ...choices] : choices;
    }

    getValue(): T | null {
        return this.value;
    }

    setValue(value: T | null): void {
        this.value = value;
    }

    getChoices() {
        return this.choiceList;
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
