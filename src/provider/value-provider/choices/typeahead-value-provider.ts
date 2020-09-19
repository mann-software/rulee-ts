import { Choice } from "../../../properties/choice";
import { PropertyScalar } from "../../../properties/property-scalar";
import { ValueProvider } from "../value-provider";

export class TypeaheadValueProvider<T> implements ValueProvider<[T | null, string]> {

    private value: T | null = null;

    constructor(
        private readonly inputSource: PropertyScalar<string>,
        private readonly choicesSource: PropertyScalar<Choice<T>[]>
    ) { }

    getValue(): [T | null, string] | null {
        return [this.value, this.inputSource.getNonNullValue()];
    }

    setValue(value: [T | null, string] | null): void {
        if (value) {
            this.value = value[0];
            this.inputSource.setValue(value[1]);
        } else {
            this.value = null;
            this.inputSource.setValue('');
        }
    }

    getChoices() {
        return this.choicesSource.getNonNullValue()
            .map(c => ({
                value: [c.value, c.displayValue] as [T | null, string],
                displayValue: c.displayValue 
            }));
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
