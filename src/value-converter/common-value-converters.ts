import { ValueConverter } from "./value-converter";

// -- string converter ---------------

export class StringValueConverter implements ValueConverter<string> {
    fromDisplayValue(value: string | null): string | null {
        return value;
    }
    asDisplayValue(value: string | null): string {
        return value ?? '';
    }
}

export class UpperCaseStringValueConverter implements ValueConverter<string> {
    fromDisplayValue(value: string | null): string | null {
        return value && value.toUpperCase();
    }
    asDisplayValue(value: string | null): string {
        return value ?? '';
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
        return value == null ? '' : value.toString();
    }
}

// -- boolean converter ---------------

export class BooleanConverter implements ValueConverter<boolean> {

    constructor(private trueString: string, private falseString: string) {}

    fromDisplayValue(value: string | null): boolean | null {
        return value === this.trueString;
    }
    asDisplayValue(value: boolean | null): string {
        return value ? this.trueString : this.falseString;
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
