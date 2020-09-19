import { ValueConverter } from "../value-converter";
import { Choice } from "../../properties/choice";

export class SelectValueConverter<T> implements ValueConverter<T> {

    private readonly choiceFcn: () => Choice<T>[];

    constructor(
        choices: Choice<T>[] | (() => Choice<T>[]),
        private readonly emptyChoice?: Choice<T>
    ) {
        this.choiceFcn = choices instanceof Function ? choices : () => choices;
    }

    fromDisplayValue(value: string | null): T | null {
        const choice = this.choiceFcn().find(c => c.displayValue === value);
        return choice?.value 
            ?? (value === this.emptyChoice?.displayValue ? this.emptyChoice.value :  null);
    }

    asDisplayValue(value: T | null): string {
        if (value == null) {
            return this.emptyChoice?.displayValue ?? '';
        } else {
            const choice = this.choiceFcn().find(c => c.value === value);
            return choice?.displayValue 
                ?? (value === this.emptyChoice?.value ? this.emptyChoice.displayValue :  '');
        }
    }

    getNullFallbackValue() {
        const fallback = this.emptyChoice?.value ?? this.choiceFcn()[0]?.value;
        if (fallback) {
            return fallback;
        } else {
            throw new Error('No fallback available');
        }
    }
}
