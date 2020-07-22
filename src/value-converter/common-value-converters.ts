import { ValueConverter } from "./value-converter";

// -- string converter ---------------

export class StringValueConverter implements ValueConverter<string> {
    fromDisplayValue(value: string | null): string | null {
        return value;
    }
    asDisplayValue(value: string | null): string {
        return value ?? '';
    }
    getNullFallbackValue() {
        return '';
    }
}

export class UpperCaseStringValueConverter implements ValueConverter<string> {
    fromDisplayValue(value: string | null): string | null {
        return value?.toUpperCase() ?? null;
    }
    asDisplayValue(value: string | null): string {
        return value ?? '';
    }
    getNullFallbackValue() {
        return '';
    }
}

// -- number converter ---------------

export class NumberValueConverter implements ValueConverter<number> {
    fromDisplayValue(value: string | null): number | null {
        if (!value) {
            return null;
        }
        const converted = Number.parseFloat(value);
        return Number.isNaN(converted) ? null : converted;
    }
    asDisplayValue(value: number | null): string {
        return value == null ? '' : value.toLocaleString();
    }
    getNullFallbackValue() {
        return 0;
    }
}

export class PrecisionNumberValueConverter implements ValueConverter<number> {

    constructor (protected precision: number) { }

    fromDisplayValue(value: string | null): number | null {
        if (!value) {
            return null;
        }
        const converted = Number.parseFloat(value);
        return Number.isNaN(converted) ? null : converted;
    }
    asDisplayValue(value: number | null): string {
        return value == null ? '' : value.toFixed(this.precision);
    }
    getNullFallbackValue() {
        return 0;
    }
}

export class IntegerValueConverter implements ValueConverter<number> {
    fromDisplayValue(value: string | null): number | null {
        if (!value) {
            return null;
        }
        const converted = Number.parseInt(value);
        return Number.isNaN(converted) ? null : converted;
    }
    asDisplayValue(value: number | null): string {
        return value == null ? '' : value.toFixed(0);
    }
    getNullFallbackValue() {
        return 0;
    }
}

// -- boolean converter ---------------

export class BooleanConverter implements ValueConverter<boolean> {

    private readonly loweredTrueString = this.trueString.toLowerCase();

    constructor(private readonly trueString: string, private readonly falseString: string) { }

    fromDisplayValue(value: string | null): boolean | null {
        return value?.toLowerCase() === this.loweredTrueString;
    }
    asDisplayValue(value: boolean | null): string {
        return value ? this.trueString : this.falseString;
    }
    getNullFallbackValue() {
        return false;
    }
}

// -- C constant -----------------

export const C = {
    string: {
        identity: new StringValueConverter(),
        upperCase: new UpperCaseStringValueConverter(),
    },
    number: {
        default: new NumberValueConverter(),
        withPrecision: (precision: number) => new PrecisionNumberValueConverter(precision),
        integer: new IntegerValueConverter(),
    },
    boolean: {
        default: new BooleanConverter('true', 'false'),
        jaNein: new BooleanConverter('Ja', 'Nein'),
    }
}
