import { ChoiceValueConverter } from './choice-value-converter';

test('default choice converter with empty choice', () => {
    const choiceValueConverter = new ChoiceValueConverter<number>([
        {value: 0, displayValue: 'A'},
        {value: 1, displayValue: 'B'},
        {value: 2, displayValue: 'C'},
    ], {value: null, displayValue: '...'});

    expect(choiceValueConverter.asDisplayValue(0)).toBe('A');
    expect(choiceValueConverter.asDisplayValue(null)).toBe('...');
    expect(choiceValueConverter.asDisplayValue(12)).toBe('');

    expect(choiceValueConverter.fromDisplayValue('A')).toBe(0);
    expect(choiceValueConverter.fromDisplayValue('...')).toBe(null);
    expect(choiceValueConverter.fromDisplayValue('unknown')).toBe(null);
});

test('default choice converter without empty choice', () => {
    const choiceValueConverter = new ChoiceValueConverter<number>([
        {value: 0, displayValue: 'A'},
        {value: 1, displayValue: 'B'},
        {value: 2, displayValue: 'C'},
    ]);

    expect(choiceValueConverter.asDisplayValue(0)).toBe('A');
    expect(choiceValueConverter.asDisplayValue(null)).toBe('');

    expect(choiceValueConverter.fromDisplayValue('A')).toBe(0);
    expect(choiceValueConverter.fromDisplayValue('unknown')).toBe(null);
});

