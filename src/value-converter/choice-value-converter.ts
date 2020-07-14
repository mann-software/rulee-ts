import { ValueConverter } from "./value-converter";
import { Choice } from "../properties/choice";

export class ChoiceValueConverter<T> implements ValueConverter<T> {

    constructor(private choices: Choice<T>[], private emptyChoice?: Choice<T>) { }

    fromDisplayValue(value: string | null): T | null {
        const choice = this.choices.find(c => c.displayValue === value);
        return choice?.value ?? this.emptyChoice?.value ?? null;
    }

    asDisplayValue(value: T | null): string {
        if (value == null) {
            return this.emptyChoice?.displayValue ?? '';
        } else {
            const choice = this.choices.find(c => c.value === value);
            return choice?.displayValue ?? '';
        }
    }
}
