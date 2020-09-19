import { ruleBuilderAndEngineFactory } from "./utils/test-utils";

test('static property choice WITHOUT default choice and WITHOUT empty choice', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();

    const propA = ruleBuilder.scalar.choicesProperty('PROP_A', [
        { value: 'a', displayValue: 'A' },
        { value: 'b', displayValue: 'B' },
    ]);

    expect(propA.getChoices()).toStrictEqual([
        { value: 'a', displayValue: 'A' },
        { value: 'b', displayValue: 'B' }
    ]);

    expect(propA.getValue()).toBe('a');
    expect(propA.getDisplayValue()).toBe('A');

    propA.setValue('a');
    expect(propA.getValue()).toBe('a');
    expect(propA.getDisplayValue()).toBe('A');

    propA.setValue('b');
    expect(propA.getValue()).toBe('b');
    expect(propA.getDisplayValue()).toBe('B');

    propA.setValue('c');
    expect(propA.getValue()).toBe('c');
    expect(propA.getDisplayValue()).toBe('');
});

test('static property choice WITHOUT default choice and WITH empty choice', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();

    const propB = ruleBuilder.scalar.choicesProperty('PROP_B', [
        { value: 1, displayValue: 'A' },
        { value: 2, displayValue: 'B' },
    ], { value: null, displayValue: '...' });

    expect(propB.getChoices()).toStrictEqual([
        { value: null, displayValue: '...' },
        { value: 1, displayValue: 'A' },
        { value: 2, displayValue: 'B' }
    ]);

    expect(propB.getValue()).toBe(null);
    expect(propB.getDisplayValue()).toBe('...');

    propB.setValue(1);
    expect(propB.getValue()).toBe(1);
    expect(propB.getDisplayValue()).toBe('A');

    propB.setValue(2);
    expect(propB.getValue()).toBe(2);
    expect(propB.getDisplayValue()).toBe('B');

    propB.setValue(3);
    expect(propB.getValue()).toBe(3);
    expect(propB.getDisplayValue()).toBe('');
});

test('static property choice WITHOUT default choice and WITHOUT ANY choice', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    const propC = ruleBuilder.scalar.choicesProperty('PROP_C', []);

    expect(propC.getChoices()).toStrictEqual([]);
    expect(propC.getValue()).toBe(null);
    expect(propC.getDisplayValue()).toBe('');
});

test('static property choice WITH default choice and WITHOUT ANY choice', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory({ defaultEmptyChoiceDisplayValue: '...' });
    const propD = ruleBuilder.scalar.choicesProperty('PROP_D', []);

    expect(propD.getChoices()).toStrictEqual([
        { value: null, displayValue: '...' }
    ]);

    expect(propD.getValue()).toBe(null);
    expect(propD.getDisplayValue()).toBe('...');
});

test('derived property choice', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    const propE = ruleBuilder.scalar.booleanProperty('PROP_E', { initialValue: false });
    const propF = ruleBuilder.scalar.derivedChoicesProperty1('PROP_F', propE, {
        derive: (propE) => {
            const choices = [
                { value: false, displayValue: 'No' }
            ];
            if (propE.getValue()) {
                choices.push({ value: true, displayValue: 'Yes' })
            }
            return choices;
        }
    }, { value: null, displayValue: 'Undetermined' });

    expect(propE.getValue()).toBe(false);
    expect(propF.getValue()).toBe(null);
    expect(propF.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' }
    ]);

    propF.setValue(true);
    expect(propF.getValue()).toBe(true);
    expect(propF.getDisplayValue()).toBe('');
    expect(propF.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' }
    ]);

    propE.setValue(true);
    expect(propF.getDisplayValue()).toBe('Yes');
    expect(propF.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' },
        { value: true, displayValue: 'Yes' }
    ]);
});
