import { PropertyScalar } from "../properties/property-scalar";
import { groupRules } from "../rules/group-of-properties-rules-definition";
import { rules, rulesWithDeps } from "../rules/scalar-rules-definition";
import { TextInterpreter } from "../util/text-interpreter/text-interpreter";
import { builderAndRuleEngineFactory } from "./utils/test-utils";

test('defining visibility', () => {
    const [builder] = builderAndRuleEngineFactory();
    const propA = builder.scalar.stringProperty('PROP_A', {
        initialValue: 'ABC'
    });
    const propB = builder.scalar.numberProperty('PROP_B', { zeroIsConsideredAsEmpty: true });
    const propC = builder.scalar.numberProperty('PROP_C');
    const propD = builder.scalar.booleanProperty('PROP_D', {
        initialValue: null
    });
    const propE = builder.scalar.booleanProperty('PROP_E', { initialValue: false });

    builder.scalar.bind(propB, rules(builder => builder.setVisibility(false)));
    builder.scalar.bind(propC, rules(builder => builder.defineInitialValue(3).defineVisibility()(self => self.getNonNullValue() > 0)));
    builder.scalar.bind(propD, rulesWithDeps((builder, propA: PropertyScalar<string>) => {
        builder.defineVisibility(propA)((self, propA) => !!propA.getValue());
    })([propA]));
    builder.scalar.bind(propE, rulesWithDeps((builder, propA: PropertyScalar<string>, propD: PropertyScalar<boolean>) => {
        builder.defineVisibility(propA, propD)((self, propA, propD) => {
            return !!self.getValue() && !!propA.getValue() && !!propD.getValue()
        });
    })([propA, propD]));

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
    const [builder] = builderAndRuleEngineFactory();
    const propA = builder.scalar.select.static('PROP_A', [
        { value: 0, displayValue: 'Not visible, not required' },
        { value: 1, displayValue: 'Visible, but not required' },
        { value: 2, displayValue: 'Visible and required' }
    ], {}, rules(builder => {
        builder.defineVisibility()(self => self.getValue() !== 0)
            .defineRequiredIfVisible()(self => self.getValue() !== 1);
    }));

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
    const [builder] = builderAndRuleEngineFactory();
    // you can create any attribute you require and attach it to properties 
    const customAttribute = builder.defineCustomAttribute<Date>('lastModified');

    const propA = builder.scalar.numberProperty('PropA', {
        initialValue: 12
    }, rules(builder => {
        // attach your custom attribute to a property like the other predefined attributes, e.g. visible
        builder.define(customAttribute)(self => new Date(2020, 0, self.getValue() ?? 1));
    }));

    expect(propA.get(customAttribute)).toEqual(new Date(2020, 0, 12));
});

test('predefined rule that is to set a property to initial state on other property changed', () => {
    const [builder] = builderAndRuleEngineFactory();
    const propA = builder.scalar.numberProperty('PropA', {
        initialValue: 42
    });
    const propB = builder.scalar.numberProperty('PropB', {
        initialValue: 0
    });
    builder.scalar.bind(propA, rules(builder => {
        builder.setToInitialStateOnOtherPropertyChanged(propB);
    }));

    propA.setValue(7);
    expect(propA.getValue()).toBe(7);

    // set the value but do not actually change it
    propB.setValue(0);
    expect(propA.getValue()).toBe(7); // no actual change, still 7
    expect(propB.getValue()).toBe(0);

    // set the value and do change it
    propB.setValue(1);
    expect(propA.getValue()).toBe(42); // propB changed -> setToInitialState as defined in rules part
    expect(propB.getValue()).toBe(1);
});

test('defining placeholder, labels and infotext', () => {
    const [builder] = builderAndRuleEngineFactory();
    const propA = builder.scalar.booleanProperty('PROP_A');
    const propB = builder.scalar.booleanProperty('PROP_B');
    const propC = builder.scalar.booleanProperty('PROP_C', {
        labelAndPlaceholder: 'Label and Placeholder of C'
    });

    builder.scalar.bind(propA, rules(builder => {
        builder.defineLabel('Label A')
            .defineInfoText('Info A');
    }));
    builder.scalar.bind(propB, rules(builder => {
        builder.defineLabelAndPlaceholder('Label and Placeholder');
    }));

    expect(propA.getLabel()).toBe('Label A');
    expect(propA.getPlaceholder()).toBe('');
    expect(propA.getInfoText()).toBe('Info A');

    expect(propB.getLabel()).toBe('Label and Placeholder');
    expect(propB.getPlaceholder()).toBe('Label and Placeholder');
    expect(propB.getInfoText()).toBe('');

    expect(propC.getLabel()).toBe('Label and Placeholder of C');
    expect(propC.getPlaceholder()).toBe('Label and Placeholder of C');
});

test('defining label with text interpretor', () => {
    const [builder] = builderAndRuleEngineFactory({
        textInterpreterHtml: {
            interpreteText: (input: string) => input.replace('<>', '')
        }
    });
    const propA = builder.scalar.booleanProperty('PROP_A', {}, rules(builder => {
        builder.defineLabel('Label A<>', TextInterpreter.Html);
        expect(() => builder.defineInfoText('Info A<>', TextInterpreter.Markdown)).toThrowError();
    }));
    
    expect(propA.getLabel()).toBe('Label A');
});

test('defining group visibility', () => {
    const [builder] = builderAndRuleEngineFactory();

    const visibleIfPositive = rules<number>(builder => builder.defineVisibility()(self => self.getNonNullValue() > 0));

    const propA = builder.scalar.numberProperty('PROP_A', {}, visibleIfPositive);
    const propB = builder.scalar.numberProperty('PROP_B', {}, visibleIfPositive);

    const group = builder.group.of('GROUP', {
        propA,
        propB,
    }, groupRules(builder => {
        builder.defineVisibleIfAllMembersVisible()
    }));
    
    expect(propA.isVisible()).toBe(false);
    expect(propB.isVisible()).toBe(false);
    expect(group.isVisible()).toBe(false);

    propA.setValue(1);
    
    expect(propA.isVisible()).toBe(true);
    expect(propB.isVisible()).toBe(false);
    expect(group.isVisible()).toBe(false);

    propB.setValue(1);
    
    expect(propA.isVisible()).toBe(true);
    expect(propB.isVisible()).toBe(true);
    expect(group.isVisible()).toBe(true);
});
