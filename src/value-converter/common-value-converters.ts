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

// -- date converter ---------------

function pad0(no: number) {
    return no < 10 ? `0${no}` : no;
}

function toDate(year: number, month: number, day: number) {
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        // create date object and check the boundaries
        month--; // bias due to start of months as of 0 (january)
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }
    return null;
}

const currentYear = (new Date()).getFullYear();
const currentCentury = Math.floor(currentYear / 100) * 100;
const currentMonth = (new Date()).getMonth() + 1;
const digitsOnly = /^\d+$/;

export class IsoDateConverter implements ValueConverter<Date> {

    fromDisplayValue(value: string | null): Date | null {
        if (value) {
            let day = NaN;
            let month = NaN;
            let year = NaN;

            const splitted = value.split('-');
            if (splitted.length > 3 || splitted.some(split => !digitsOnly.test(split))) {
                // not numbers or empty part like '01..20' or '1q.8.20'
                return null;
            }
            if (splitted.length === 1) {
                value = splitted[0];
                if (value.length < 1 || value.length > 8 || (value.length !== 1 && value.length % 2 !== 0)) {
                    return null;
                }
                // expect formats without dots like these:
                // 01 => 01.07.2020 (month and year of current date)
                // 0701 => 2020-07-01 (year of current date)
                // 200701 => 2020-07-01 (year of current century)
                // 20200701 => 2020-07-01
                if (value.length === 8) {
                    year = Number.parseInt(value.substr(0, 4));
                    month = Number.parseInt(value.substr(4, 2));
                    day = Number.parseInt(value.substr(6, 2));
                } else if (value.length === 6) {
                    year = Number.parseInt(value.substr(0, 2)) + currentCentury;
                    month = Number.parseInt(value.substr(2, 2));
                    day = Number.parseInt(value.substr(4, 2));
                } else if (value.length === 4) {
                    year = currentYear;
                    month = Number.parseInt(value.substr(0, 2));
                    day = Number.parseInt(value.substr(2, 2));
                } else {
                    year = currentYear;
                    month = currentMonth;
                    day = Number.parseInt(value);
                }
            } else if (splitted.length === 2) {
                year = currentYear;
                if (splitted[0].length <= 2 && splitted[1].length <= 2) {
                    month = Number.parseInt(splitted[0]);
                    day = Number.parseInt(splitted[1]);
                }
            } else {
                if (splitted[0].length === 2) {
                    year = Number.parseInt(splitted[0]) + currentCentury;
                } else if (splitted[0].length === 4) {
                    year = Number.parseInt(splitted[0]);
                }
                if (splitted[1].length <= 2 && splitted[2].length <= 2) {
                    month = Number.parseInt(splitted[1]);
                    day = Number.parseInt(splitted[2]);
                }
            }
            return toDate(year, month, day);
        }
        return null;
    }

    asDisplayValue(value: Date | null): string {
        if (value) {
            const month = value.getMonth() + 1;
            return `${value.getFullYear()}-${pad0(month)}-${pad0(value.getDate())}`;
        } else {
            return '';
        }
    }

    getNullFallbackValue() {
        return new Date();
    }
}

/**
 * Specialised Date Converter for use with German language (especially fromDisplayValue)
 * 
 * Design to work with Dates in range of [current year - 100, current year + 100]
 */
export class GermanDateConverter implements ValueConverter<Date> {

    fromDisplayValue(value: string | null): Date | null {
        if (value) {
            let day = NaN;
            let month = NaN;
            let year = NaN;

            const splitted = value.split('.');
            if (splitted[splitted.length - 1] === '') {
                // for case: '01.01.'.split('.') => ['01', '01', ''] => remove last ''
                splitted.pop();
            }
            if (splitted.length > 3 || splitted.some(split => !digitsOnly.test(split))) {
                // not numbers or empty part like '01..20' or '1q.8.20'
                return null;
            }
            if (splitted.length === 1) {
                value = splitted[0];
                if (value.length < 1 || value.length > 8 || (value.length !== 1 && value.length % 2 !== 0)) {
                    return null;
                }
                // expect formats without dots like these:
                // 01 => 01.07.2020 (month and year of current date)
                // 0107 => 01.07.2020 (year of current date)
                // 010720 => 01.07.2020 (year of current century)
                // 01072020 => 01.07.2020
                day = Number.parseInt(value.substr(0, 2));
                if (value.length <= 2) {
                    month = currentMonth;
                    year = currentYear;
                } else {
                    month = Number.parseInt(value.substr(2, 2));
                }
                if (value.length === 4) {
                    year = currentYear;
                } else if (value.length === 6) {
                    year = Number.parseInt(value.substr(4, 2)) + currentCentury;                    
                } else if (value.length === 8) {
                    year = Number.parseInt(value.substr(4, 4));
                }
            } else {
                if (splitted[0].length <= 2 && splitted[1].length <= 2) {
                    day = Number.parseInt(splitted[0]);
                    month = Number.parseInt(splitted[1]);
                }
                if (splitted.length === 2) {
                    year = currentYear;
                } else if (splitted[2].length === 4) {
                    year = Number.parseInt(splitted[2]);
                } else if (splitted[2].length === 2) {
                    year = Number.parseInt(splitted[2]) + currentCentury;
                }
            }
            return toDate(year, month, day);
        }
        return null;
    }

    asDisplayValue(value: Date | null): string {
        if (value) {
            const month = value.getMonth() + 1;
            return `${pad0(value.getDate())}.${pad0(month)}.${value.getFullYear()}`;
        } else {
            return '';
        }
    }

    getNullFallbackValue() {
        return new Date();
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
    },
    date: {
        iso: new IsoDateConverter(),
        german: new GermanDateConverter(),
    }
}
