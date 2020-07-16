import { ruleEngineBuilderFactory } from "./utils/test-utils";
import { RuleEngineBuilder } from "../engine/builder/rule-engine-buider";
import { C } from "../value-converter/common-value-converters";

let ruleEngineBuilder: RuleEngineBuilder = ruleEngineBuilderFactory();

beforeEach(() => {
    ruleEngineBuilder = ruleEngineBuilderFactory();
});

test('synchronously derived properties work', () => {
    const propA = ruleEngineBuilder.scalar.numberProperty('PROP_A', { initialValue: 0 });

    const propB = ruleEngineBuilder.scalar.derivedProperty1('PROP_B', C.number.default, propA, {
        derive: (propA) => (propA.getValue() ?? 0) * 2
    });

    const propC = ruleEngineBuilder.scalar.derivedProperty2('PROP_C', C.number.default, propA, propB, {
        derive: (propA, propB) => (propA.getValue() ?? 0)  + (propB.getValue() ?? 0),
        inverse: (propA, propB, val) => val ? propA.setValue(val / 3) : propA.setValue(0)
    });

    // important to actually create the rule engine
    ruleEngineBuilder.create();

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
