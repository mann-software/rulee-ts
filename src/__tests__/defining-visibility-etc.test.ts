import { ruleBuilderAndEngineFactory } from "./utils/test-utils";

test('defining visibility', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    const propA = ruleBuilder.scalar.stringProperty('PROP_A', {
        initialValue: 'ABC'
    });
    const propB = ruleBuilder.scalar.numberProperty('PROP_B', { zeroIsConsideredAsEmpty: true });
    const propC = ruleBuilder.scalar.numberProperty('PROP_C');
    const propD = ruleBuilder.scalar.booleanProperty('PROP_D', {
        initialValue: null
    });
    const propE = ruleBuilder.scalar.booleanProperty('PROP_E', { initialValue: false });

    ruleBuilder.scalar.bind(propB).setVisibility(false);
    ruleBuilder.scalar.bind(propC).defineInitialValue(3).defineVisibility()(self => self.getNonNullValue() > 0);
    ruleBuilder.scalar.bind(propD).defineVisibility(propA)((self, propA) => !!propA.getValue());
    ruleBuilder.scalar.bind(propE).defineVisibility(propA, propD)((self, propA, propD) => {
        return !!self.getValue() && !!propA.getValue() && !!propD.getValue()
    });

    expect(propA.getValue()).toBe('ABC');
    expect(propA.isVisible()).toBe(true);

    expect(propB.getValue()).toBe(0);
    expect(propB.isVisible()).toBe(false);

    expect(propC.getValue()).toBe(3);
    expect(propC.isVisible()).toBe(true);

    expect(propD.getValue()).toBe(null);
    expect(propD.isVisible()).toBe(true);

    expect(propE.getValue()).toBe(false);
    expect(propE.isVisible()).toBe(false);
});

test('defining "requiredIfVisible"', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    const propA = ruleBuilder.scalar.select.static('PROP_A', [
        { value: 0, displayValue: 'Not visible, not required' },
        { value: 1, displayValue: 'Visible, but not required' },
        { value: 2, displayValue: 'Visible and required' }
    ]);
    ruleBuilder.scalar.bind(propA)
        .defineVisibility()(self => self.getValue() !== 0)
        .defineRequiredIfVisible()(self => self.getValue() !== 1);

    expect(propA.getValue()).toBe(0);
    expect(propA.getDisplayValue()).toBe('Not visible, not required');
    expect(propA.isVisible()).toBe(false);
    // required is never true if visible is false
    expect(propA.isRequired()).toBe(false);

    propA.setValue(1);

    expect(propA.getValue()).toBe(1);
    expect(propA.getDisplayValue()).toBe('Visible, but not required');
    expect(propA.isVisible()).toBe(true);
    // visible is true, now required is returned according to definition => false
    expect(propA.isRequired()).toBe(false);

    propA.setValue(2);

    expect(propA.getValue()).toBe(2);
    expect(propA.getDisplayValue()).toBe('Visible and required');
    expect(propA.isVisible()).toBe(true);
    // visible is true and required is according to definition also true
    expect(propA.isRequired()).toBe(true);
});

test('defining a custom attribute', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    // you can create any attribute you require and attach it to properties 
    const customAttribute = ruleBuilder.defineCustomAttribute<Date>('lastModified');

    const propA = ruleBuilder.scalar.numberProperty('PropA', {
        initialValue: 12
    });
    // attach your custom attribute to a property like the other predefined attributes, e.g. visible
    ruleBuilder.scalar.bind(propA).define(customAttribute)(self => new Date(2020, 0, self.getValue() ?? 1));

    expect(propA.get(customAttribute)).toEqual(new Date(2020, 0, 12));
});

test('defining placeholder, labels and infotext', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    const propA = ruleBuilder.scalar.booleanProperty('PROP_A');
    const propB = ruleBuilder.scalar.booleanProperty('PROP_B');

    ruleBuilder.scalar.bind(propA)
        .defineLabel('Label A')
        .defineInfoText('Info A');
    ruleBuilder.scalar.bind(propB).defineLabelAndPlaceholder('Label and Placeholder');

    expect(propA.getLabel()).toBe('Label A');
    expect(propA.getPlaceholder()).toBe('');
    expect(propA.getInfoText()).toBe('Info A');

    expect(propB.getLabel()).toBe('Label and Placeholder');
    expect(propB.getPlaceholder()).toBe('Label and Placeholder');
    expect(propB.getInfoText()).toBe('');
});
