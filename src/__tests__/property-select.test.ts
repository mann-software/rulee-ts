import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { valueAfterTime } from "./utils/timing-utils";

test('static property select WITHOUT default choice and WITHOUT empty choice', () => {
    const [builder] = builderAndRuleEngineFactory();

    const propA = builder.scalar.select.static('PROP_A', [
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

test('static property select WITHOUT default choice and WITH empty choice', () => {
    const [builder] = builderAndRuleEngineFactory();

    const propB = builder.scalar.select.static('PROP_B', [
        { value: 1, displayValue: 'A' },
        { value: 2, displayValue: 'B' },
    ], {
        emptyChoice: { value: null, displayValue: '...' }
    });

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

test('static property select WITHOUT default choice and WITHOUT ANY choice', () => {
    const [builder] = builderAndRuleEngineFactory();
    const propC = builder.scalar.select.static('PROP_C', []);

    expect(propC.getChoices()).toStrictEqual([]);
    expect(propC.getValue()).toBe(null);
    expect(propC.getDisplayValue()).toBe('');
});

test('static property select WITH default choice and WITHOUT ANY choice', () => {
    const [builder] = builderAndRuleEngineFactory({ defaultEmptyChoiceDisplayValue: '...' });
    const propD = builder.scalar.select.static('PROP_D', []);

    expect(propD.getChoices()).toStrictEqual([
        { value: null, displayValue: '...' }
    ]);

    expect(propD.getValue()).toBe(null);
    expect(propD.getDisplayValue()).toBe('...');
});

test('derived property select', () => {
    const [builder] = builderAndRuleEngineFactory();
    const propE = builder.scalar.booleanProperty('PROP_E', { initialValue: false });
    const propF = builder.scalar.select.derived('PROP_F', propE)({
        derive: (propE) => {
            const choices = [
                { value: false, displayValue: 'No' }
            ];
            if (propE.getValue()) {
                choices.push({ value: true, displayValue: 'Yes' })
            }
            return choices;
        },
        emptyChoice: { value: null, displayValue: 'Undetermined' }
    });

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

test('async derived property select', async () => {
    const [builder] = builderAndRuleEngineFactory();
    const propG = builder.scalar.booleanProperty('PROP_G', { initialValue: false });
    const propH = builder.scalar.select.asyncDerived('PROP_H', propG)({
        deriveAsync: (propG) => {
            const choices = [
                { value: false, displayValue: 'No' }
            ];
            if (propG.getValue()) {
                choices.push({ value: true, displayValue: 'Yes' })
            }
            return valueAfterTime(choices, 50);
        },
        emptyChoice: { value: null, displayValue: 'Undetermined' }
    });

    expect(propG.getValue()).toBe(false);
    expect(propH.getValue()).toBe(null);
    expect(propH.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' }
    ]);

    await propH.awaitValue();
    expect(propH.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' }
    ]);

    propH.setValue(true);
    expect(propH.getValue()).toBe(true);
    expect(propH.getDisplayValue()).toBe('');
    expect(propH.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' }
    ]);

    propG.setValue(true);
    expect(propH.getValue()).toBe(true);
    expect(propH.getDisplayValue()).toBe('');
    expect(propH.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' }
    ]);

    await propH.awaitValue();
    expect(propH.getDisplayValue()).toBe('Yes');
    expect(propH.getChoices()).toStrictEqual([
        { value: null, displayValue: 'Undetermined' },
        { value: false, displayValue: 'No' },
        { value: true, displayValue: 'Yes' }
    ]);
});
