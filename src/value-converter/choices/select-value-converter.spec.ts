import { SelectValueConverter } from './select-value-converter';

test('default choice converter with empty choice', () => {
    const selectValueConverter = new SelectValueConverter<number>([
        {value: 0, displayValue: 'A'},
        {value: 1, displayValue: 'B'},
        {value: 2, displayValue: 'C'},
    ], {value: null, displayValue: '...'});

    expect(selectValueConverter.asDisplayValue(0)).toBe('A');
    expect(selectValueConverter.asDisplayValue(null)).toBe('...');
    expect(selectValueConverter.asDisplayValue(12)).toBe('');

    expect(selectValueConverter.fromDisplayValue('A')).toBe(0);
    expect(selectValueConverter.fromDisplayValue('...')).toBe(null);
    expect(selectValueConverter.fromDisplayValue('unknown')).toBe(null);
});

test('default choice converter without empty choice', () => {
    const selectValueConverter = new SelectValueConverter<number>([
        {value: 0, displayValue: 'A'},
        {value: 1, displayValue: 'B'},
        {value: 2, displayValue: 'C'},
    ]);

    expect(selectValueConverter.asDisplayValue(0)).toBe('A');
    expect(selectValueConverter.asDisplayValue(null)).toBe('');

    expect(selectValueConverter.fromDisplayValue('A')).toBe(0);
    expect(selectValueConverter.fromDisplayValue('unknown')).toBe(null);
});

