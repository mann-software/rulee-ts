import { ValueConverter } from "../value-converter";

export class TypeaheadValueConverter<T> implements ValueConverter<[T | null, string]> {

    fromDisplayValue(value: string | null): [T | null, string] {
        // work is done in TypeaheadValueProvider
        return [null, value ?? ''];
    }

    asDisplayValue(value: [T | null, string] | null): string {
        return value?.[1] ?? '';
    }

    getNullFallbackValue() {
        return [null, ''] as [T | null, string];
    }
}
