import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { C } from "../value-converter/common-value-converters";
import { EmptyValueFcns } from "../provider/value-provider/empty-value-fcn";

test('define number properties', () => {
    const [builder] = builderAndRuleEngineFactory();

    // A: you can use simpleProperty or specialised numberProperty - the following are equivalent
    const numberProp = builder.scalar.simpleProperty('NUMBER_PROP', C.number.default);
    const numberPropShort = builder.scalar.numberProperty('NUMBER_PROP_SHORT', {
        zeroIsConsideredAsEmpty: false, // can even be ommited here since false is the default
        valueConverter: C.number.default // can also be ommited here since C.number.default is the default
    });

    // B: the following is equivalent as well
    const numberPropZeroIsEmpty = builder.scalar.simpleProperty('NUMBER_PROP_ZERO_IS_EMPTY', C.number.integer);
    const numberPropZeroIsEmptyShort = builder.scalar.numberProperty('NUMBER_PROP_ZERO_IS_EMPTY_SHORT', {
        valueConverter: C.number.integer,
        zeroIsConsideredAsEmpty: true
    });
    builder.scalar.bind(numberPropZeroIsEmpty).defineInitialValue(0);

    // A
    expect(numberProp.getValue()).toBe(numberPropShort.getValue());
    expect(numberProp.getDisplayValue()).toBe(numberPropShort.getDisplayValue());

    // B
    expect(numberPropZeroIsEmpty.getValue()).toBe(numberPropZeroIsEmptyShort.getValue());
    expect(numberPropZeroIsEmpty.getDisplayValue()).toBe(numberPropZeroIsEmptyShort.getDisplayValue());
});

test('no duplicated property id´s else error is thrown', () => {
    const [builder] = builderAndRuleEngineFactory();
    builder.scalar.booleanProperty('PROP');
    expect(() => builder.scalar.numberProperty('PROP')).toThrowError();
});
