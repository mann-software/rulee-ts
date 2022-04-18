import { isPropertyScalar } from "../properties/property-scalar";
import { isPropertyScalarWithChoices } from "../properties/property-scalar-with-choices";
import { builderAndRuleEngineFactory } from "./utils/test-utils";

test('empty number property', () => {
    const [builder] = builderAndRuleEngineFactory();

    const numProp1 = builder.scalar.numberProperty('numProp1', {
        initialValue: 0,
        zeroIsConsideredAsEmpty: true
    });
    
    expect(isPropertyScalar(numProp1)).toBe(true);
    expect(isPropertyScalarWithChoices(numProp1)).toBe(false);

    expect(numProp1.isEmpty()).toBe(true);
    numProp1.setValue(1);
    expect(numProp1.isEmpty()).toBe(false);
    numProp1.setValue(NaN);
    expect(numProp1.isEmpty()).toBe(true);

    const numProp2 = builder.scalar.numberProperty('numProp2', {
        zeroIsConsideredAsEmpty: false
    });
    expect(numProp2.getValue()).toBe(null);
    expect(numProp2.isEmpty()).toBe(true);
    numProp2.setValue(0);
    expect(numProp2.isEmpty()).toBe(false);
    numProp1.setValue(1);
    expect(numProp2.isEmpty()).toBe(false);
    numProp2.setValue(NaN);
    expect(numProp2.isEmpty()).toBe(true);
});

test('empty string property', () => {
    const [builder] = builderAndRuleEngineFactory();

    const stringProp = builder.scalar.stringProperty('stringProp');
    stringProp.setValue(null);
    expect(stringProp.isEmpty()).toBe(true);
    stringProp.setValue("");
    expect(stringProp.isEmpty()).toBe(true);
    stringProp.setValue("1");
    expect(stringProp.isEmpty()).toBe(false);
});

test('empty boolean property', () => {
    const [builder] = builderAndRuleEngineFactory();

    const boolProp = builder.scalar.booleanProperty('boolProp');
    boolProp.setValue(null);
    expect(boolProp.isEmpty()).toBe(true);
    boolProp.setValue(true);
    expect(boolProp.isEmpty()).toBe(false);
    boolProp.setValue(false);
    expect(boolProp.isEmpty()).toBe(false);
});

test('empty date property', () => {
    const [builder] = builderAndRuleEngineFactory();

    const dateProp = builder.scalar.dateProperty('dateProp');
    dateProp.setValue(null);
    expect(dateProp.isEmpty()).toBe(true);
    dateProp.setValue(new Date());
    expect(dateProp.isEmpty()).toBe(false);
});
