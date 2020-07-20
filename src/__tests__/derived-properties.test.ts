import { ruleEngineBuilderFactory } from "./utils/test-utils";
import { RuleEngineBuilder } from "../engine/builder/rule-engine-buider";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";

let ruleEngineBuilder: RuleEngineBuilder;
let propA: PropertyScalar<number>;
let propB: PropertyScalar<number>;
let propC: PropertyScalar<number>;

beforeEach(() => {
    ruleEngineBuilder = ruleEngineBuilderFactory();
    propA = ruleEngineBuilder.scalar.numberProperty('PROP_A', { initialValue: 0 });
    
    propB = ruleEngineBuilder.scalar.derivedProperty1('PROP_B', C.number.default, propA, {
        derive: (propA) => (propA.getValue() ?? 0) * 2
    });
    
    propC = ruleEngineBuilder.scalar.derivedProperty2('PROP_C', C.number.default, propA, propB, {
        derive: (propA, propB) => (propA.getValue() ?? 0)  + (propB.getValue() ?? 0),
        inverse: (propA, propB, val) => val ? propA.setValue(val / 3) : propA.setValue(0)
    });
    
    // it is important to actually initialise the rule engine
    ruleEngineBuilder.initialise();
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
