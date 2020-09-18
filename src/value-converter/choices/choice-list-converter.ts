import { ValueConverter } from "./../value-converter";
import { Choice } from "../../properties/choice";

export class ChoiceListConverter<T> implements ValueConverter<Choice<T>[]> {

    fromDisplayValue(value: string | null): Choice<T>[] | null {
        throw new Error('Not supported');
    }

    asDisplayValue(value: Choice<T>[] | null): string {
        if (value) {
            return value.map(choice => choice.displayValue).join(', ');
        } else {
            return '';
        }
    }

    getNullFallbackValue(): Choice<T>[] {
        return [];
    }

}
