import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";

let builder: Builder;
let propA: PropertyScalar<number>;
let propB: PropertyScalar<number>;
let propC: PropertyScalar<number>;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
    propA = builder.scalar.numberProperty('PROP_A', { initialValue: 0 });
    
    propB = builder.scalar.derived.sync('PROP_B', C.number.default, propA)({
        derive: (propA) => propA.getNonNullValue() * 2
    });

    propC = builder.scalar.derived.sync('PROP_C', C.number.default, propA, propB)({
        derive: (propA, propB) => propA.getNonNullValue()  + propB.getNonNullValue(),
        inverse: (val, propA, propB) => val ? propA.setValue(val / 3) : propA.setValue(0)
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
