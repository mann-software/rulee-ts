import { ChoiceListConverter } from './choice-list-converter';

test('convert as display value', () => {
    const converter = new ChoiceListConverter<number>();

    expect(converter.asDisplayValue(null)).toBe('');
    expect(converter.asDisplayValue([
        { value: 0, displayValue: 'A' },
        { value: 1, displayValue: 'B' }
    ])).toBe('A, B');
});

test('convert from display value not supported', () => {
    const converter = new ChoiceListConverter<number>();

    expect(() => converter.fromDisplayValue('A, B')).toThrow();
});

test('fallback value is empty array', () => {
    const converter = new ChoiceListConverter<number>();

    expect(converter.getNullFallbackValue()).toEqual([]);
});
