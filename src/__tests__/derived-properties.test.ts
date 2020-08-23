import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";

let ruleBuilder: RuleBuilder;
let propA: PropertyScalar<number>;
let propB: PropertyScalar<number>;
let propC: PropertyScalar<number>;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();
    propA = ruleBuilder.scalar.numberProperty('PROP_A', { initialValue: 0 });
    
    propB = ruleBuilder.scalar.derivedProperty1('PROP_B', C.number.default, propA, {
        derive: (propA) => propA.getNonNullValue() * 2
    });
    
    propC = ruleBuilder.scalar.derivedProperty2('PROP_C', C.number.default, propA, propB, {
        derive: (propA, propB) => propA.getNonNullValue()  + propB.getNonNullValue(),
        inverse: (propA, propB, val) => val ? propA.setValue(val / 3) : propA.setValue(0)
    });
});

test('synchronously derived properties work', () => {

    expect(propA.isReadOnly()).toBe(false);
    expect(propB.isReadOnly()).toBe(true); // has no inverse function, thus, readonly
    expect(propC.isReadOnly()).toBe(false);

    expect(propA.getValue()).toBe(0);
    expect(propB.getValue()).toBe(0);
    expect(propC.getValue()).toBe(0);

    propA.setDisplayValue('20');

    expect(propA.getValue()).toBe(20);
    expect(propB.getValue()).toBe(40);
    expect(propC.getValue()).toBe(60);

    propC.setDisplayValue('30');

    expect(propA.getValue()).toBe(10);
    expect(propB.getValue()).toBe(20);
    expect(propC.getValue()).toBe(30);
});
