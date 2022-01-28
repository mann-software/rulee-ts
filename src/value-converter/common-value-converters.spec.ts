import { C } from './common-value-converters';

test('default boolean converter', () => {
    const booleanConverter = C.boolean.default;

    expect(booleanConverter.asDisplayValue(true)).toBe('true');
    expect(booleanConverter.asDisplayValue(false)).toBe('false');
    expect(booleanConverter.asDisplayValue(null)).toBe('false');
    
    expect(booleanConverter.fromDisplayValue('true')).toBe(true);
    expect(booleanConverter.fromDisplayValue('True')).toBe(true);
    expect(booleanConverter.fromDisplayValue('TRUE')).toBe(true);
    expect(booleanConverter.fromDisplayValue('false')).toBe(false);
    expect(booleanConverter.fromDisplayValue('')).toBe(false);
    expect(booleanConverter.fromDisplayValue(null)).toBe(false);
});

test('upper case converter', () => {
    const upperCaseConverter = C.string.upperCase;

    expect(upperCaseConverter.asDisplayValue('ABC')).toBe('ABC');
    expect(upperCaseConverter.asDisplayValue('Abc')).toBe('ABC');

    expect(upperCaseConverter.fromDisplayValue('ABC')).toBe('ABC');
    expect(upperCaseConverter.fromDisplayValue('Abc')).toBe('ABC');
});

test('integer converter', () => {
    const integerConverter = C.number.integer;

    expect(integerConverter.asDisplayValue(null)).toBe('');
    expect(integerConverter.asDisplayValue(0)).toBe('0');
    expect(integerConverter.asDisplayValue(1)).toBe('1');
    expect(integerConverter.asDisplayValue(-1)).toBe('-1');
    expect(integerConverter.asDisplayValue(1000)).toBe('1000');
    expect(integerConverter.asDisplayValue(-1000)).toBe('-1000');
    
    expect(integerConverter.fromDisplayValue(null)).toBe(null);
    expect(integerConverter.fromDisplayValue('')).toBe(null);
    expect(integerConverter.fromDisplayValue('abc')).toBe(null);
    expect(integerConverter.fromDisplayValue('0')).toBe(0);
    expect(integerConverter.fromDisplayValue('1')).toBe(1);
    expect(integerConverter.fromDisplayValue('1.5')).toBe(1);
    expect(integerConverter.fromDisplayValue('-1000')).toBe(-1000);
});

test('number with precision converter', () => {
    const numberPrecisionConverter = C.number.withPrecision(2);

    expect(numberPrecisionConverter.asDisplayValue(null)).toBe('');
    expect(numberPrecisionConverter.asDisplayValue(0.001)).toBe('0.00');
    expect(numberPrecisionConverter.asDisplayValue(1.0)).toBe('1.00');
    expect(numberPrecisionConverter.asDisplayValue(1.009)).toBe('1.01');
    expect(numberPrecisionConverter.asDisplayValue(-1000)).toBe('-1000.00');
    
    expect(numberPrecisionConverter.fromDisplayValue(null)).toBe(null);
    expect(numberPrecisionConverter.fromDisplayValue('')).toBe(null);
    expect(numberPrecisionConverter.fromDisplayValue('abc')).toBe(null);
    expect(numberPrecisionConverter.fromDisplayValue('0')).toBe(0);
    expect(numberPrecisionConverter.fromDisplayValue('1.001')).toBe(1);
    expect(numberPrecisionConverter.fromDisplayValue('1.009')).toBe(1.01);
    expect(numberPrecisionConverter.fromDisplayValue('1.5')).toBe(1.5);
    expect(numberPrecisionConverter.fromDisplayValue('-1000')).toBe(-1000);
});

test('iso date converter', () => {
    const converter = C.date.iso;

    const today = new Date();

    expect(converter.asDisplayValue(null)).toBe('');
    expect(converter.asDisplayValue(new Date(2020, 0, 1))).toEqual('2020-01-01');

    expect(converter.fromDisplayValue('01')).toEqual(new Date(today.getFullYear(), today.getMonth(), 1));
    expect(converter.fromDisplayValue('1')).toEqual(new Date(today.getFullYear(), today.getMonth(), 1));
    expect(converter.fromDisplayValue('0101')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('01-01')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('1-1')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('20200101')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('200101')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('2020-01-01')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('20-01-01')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('2020-1-1')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('20-1-1')).toEqual(new Date(2020, 0, 1));

    // negative tests
    expect(converter.fromDisplayValue('')).toBe(null);
    expect(converter.fromDisplayValue('20-12-1q')).toBe(null);
    expect(converter.fromDisplayValue('21-2-29')).toBe(null); // no leap year
    expect(converter.fromDisplayValue('20-2-29')).not.toBe(null); // leap year
    expect(converter.fromDisplayValue('2011')).toEqual(null);
    expect(converter.fromDisplayValue('202001011')).toEqual(null);
});

test('german date converter', () => {
    const converter = C.date.german;

    const today = new Date();

    expect(converter.asDisplayValue(null)).toBe('');
    expect(converter.asDisplayValue(new Date(2020, 0, 1))).toEqual('01.01.2020');

    expect(converter.fromDisplayValue('01')).toEqual(new Date(today.getFullYear(), today.getMonth(), 1));
    expect(converter.fromDisplayValue('01.')).toEqual(new Date(today.getFullYear(), today.getMonth(), 1));
    expect(converter.fromDisplayValue('1.')).toEqual(new Date(today.getFullYear(), today.getMonth(), 1));
    expect(converter.fromDisplayValue('0101')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('01.01')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('1.1')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('01.01.')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('1.01.')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('01.1.')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('1.1')).toEqual(new Date(today.getFullYear(), 0, 1));
    expect(converter.fromDisplayValue('01012020')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('010120')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('01.01.2020')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('01.01.20')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('1.1.2020')).toEqual(new Date(2020, 0, 1));
    expect(converter.fromDisplayValue('1.1.20')).toEqual(new Date(2020, 0, 1));

    // negative tests
    expect(converter.fromDisplayValue('')).toBe(null);
    expect(converter.fromDisplayValue('1q.12.2020')).toBe(null);
    expect(converter.fromDisplayValue('29.02.2021')).toBe(null); // no leap year
    expect(converter.fromDisplayValue('29.02.2020')).not.toBe(null); // leap year
    expect(converter.fromDisplayValue('1120')).toEqual(null);
    expect(converter.fromDisplayValue('010120200')).toEqual(null);
});
