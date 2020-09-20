import { Choice } from "../../../properties/choice";
import { PropertyScalar } from "../../../properties/property-scalar";
import { ValueProvider } from "../value-provider";

export class TypeaheadValueProvider<T> implements ValueProvider<[T | null, string]> {

    constructor(
        private readonly inputSource: PropertyScalar<string>,
        private readonly choicesSource: PropertyScalar<Choice<T>[]>
    ) { }

    getValue(): [T | null, string] | null {
        const displayValue = this.inputSource.getNonNullValue();
        const choice = this.choicesSource.getNonNullValue().find(c => c.displayValue === displayValue);
        if (choice) {
            return [choice.value, displayValue];
        }
        return [null, displayValue];
    }

    setValue(value: [T | null, string] | null): void {
        if (value != null) {
            if (value[0] != null) {
                const choice = this.choicesSource.getNonNullValue().find(c => c.value === value[0]);
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
        return this.choicesSource.getNonNullValue();
    }

    isAsynchronous(): boolean {
        return false;
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
