import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { C } from "../value-converter/common-value-converters";
import { EmptyValueFcns } from "../provider/value-provider/empty-value-fcn";

test('define number properties', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();

    // A: you can use simpleProperty or specialised numberProperty - the following are equivalent
    const numberProp = ruleBuilder.scalar.simpleProperty('NUMBER_PROP', C.number.default, EmptyValueFcns.numberEmptyValueFcn);
    const numberPropShort = ruleBuilder.scalar.numberProperty('NUMBER_PROP_SHORT', {
        zeroIsConsideredAsEmpty: false, // can even be ommited here since false is the default
        valueConverter: C.number.default // can also be ommited here since C.number.default is the default
    });

    // B: the following is equivalent as well
    const numberPropZeroIsEmpty = ruleBuilder.scalar.simpleProperty('NUMBER_PROP_ZERO_IS_EMPTY', C.number.integer, EmptyValueFcns.defaultEmptyValueFcn);
    const numberPropZeroIsEmptyShort = ruleBuilder.scalar.numberProperty('NUMBER_PROP_ZERO_IS_EMPTY_SHORT', {
        valueConverter: C.number.integer,
        zeroIsConsideredAsEmpty: true
    });
    ruleBuilder.scalar.bind(numberPropZeroIsEmpty).defineInitialValue(0);

    // A
    expect(numberProp.getValue()).toBe(numberPropShort.getValue());
    expect(numberProp.getDisplayValue()).toBe(numberPropShort.getDisplayValue());

    // B
    expect(numberPropZeroIsEmpty.getValue()).toBe(numberPropZeroIsEmptyShort.getValue());
    expect(numberPropZeroIsEmpty.getDisplayValue()).toBe(numberPropZeroIsEmptyShort.getDisplayValue());
});

test('no duplicated property id´s else error is thrown', () => {
    const [ruleBuilder] = ruleBuilderAndEngineFactory();
    ruleBuilder.scalar.booleanProperty('PROP');
    expect(() => ruleBuilder.scalar.numberProperty('PROP')).toThrowError();
});
