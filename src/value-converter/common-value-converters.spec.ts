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

// TODO test other converters
