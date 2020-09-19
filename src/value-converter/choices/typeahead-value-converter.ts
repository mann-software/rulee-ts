import { ValueConverter } from "../value-converter";
import { Choice } from "../../properties/choice";

export class TypeaheadValueConverter<T> implements ValueConverter<[T | null, string]> {

    constructor(private readonly choices: () => Choice<T>[]) { }

    fromDisplayValue(value: string | null): [T | null, string] {
        const choice = this.choices().find(c => c.displayValue === value);
        return [choice?.value ?? null, value ?? ''];
    }

    asDisplayValue(value: [T | null, string] | null): string {
        return value?.[1] ?? '';
    }

    getNullFallbackValue() {
        return [null, ''] as [T | null, string];
    }
}
