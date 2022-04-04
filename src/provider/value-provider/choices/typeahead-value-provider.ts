import { Choice } from "../../../properties/choice";
import { PropertyArrayListReadonly } from "../../../properties/property-array-list";
import { PropertyScalar } from "../../../properties/property-scalar";
import { ValueProvider } from "../value-provider";

export class TypeaheadValueProvider<T, S extends PropertyArrayListReadonly<Choice<T>>> implements ValueProvider<[T | null, string]> {

    constructor(
        private readonly inputSource: PropertyScalar<string>,
        private readonly choicesSource: S
    ) { }

    getValue(): [T | null, string] | null {
        const displayValue = this.inputSource.getNonNullValue();
        const choice = this.choicesSource.getElements().find(c => c.displayValue === displayValue);
        if (choice) {
            return [choice.value, displayValue];
        }
        return [null, displayValue];
    }

    setValue(value: [T | null, string] | null): void {
        if (value != null) {
            if (value[0] != null) {
                const choice = this.choicesSource.getElements().find(c => c.value === value[0]);
                if (choice) {
                    value[1] = choice.displayValue;
                }
            }
            this.inputSource.setValue(value[1]);
        } else {
            this.inputSource.setValue('');
        }
    }

    getChoices() {
        return this.choicesSource.getElements();
    }

    isAsynchronous(): boolean {
        return false;
    }

    setDataToInitialState(): void {
        // No-Op
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
