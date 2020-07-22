import { ruleEngineBuilderFactory } from "./utils/test-utils";
import { RuleEngineBuilder } from "../engine/builder/rule-engine-buider";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";
import { RuleEngine } from "../engine/rule-engine";
import { valueAfterTime } from "./utils/timing-utils";

let ruleEngineBuilder: RuleEngineBuilder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<string>;
let propBNumber: PropertyScalar<number>;
let propC: PropertyScalar<number>;
let propD: PropertyScalar<number>;
let ruleEngine: RuleEngine;

beforeEach(() => {
    ruleEngineBuilder = ruleEngineBuilderFactory();
    propA = ruleEngineBuilder.scalar.stringProperty('PROP_A', { initialValue: 'abc' });
    propB = ruleEngineBuilder.scalar.stringProperty('PROP_B', { initialValue: '42' });
    propBNumber = ruleEngineBuilder.scalar.numberProperty('PROP_B_NUMBER', { zeroIsConsideredAsEmpty: true });
    propC = ruleEngineBuilder.scalar.derivedProperty2('PROP_C', C.number.default, propA, propB, {
        derive: (propA, propB) => propA.getNonNullValue().length + propB.getNonNullValue().length
    });
    propD = ruleEngineBuilder.scalar.derivedAsyncProperty1('PROP_D', C.number.default, propB, {
        deriveAsync: (propA) => valueAfterTime(propA.getNonNullValue().length, 40)
    });
    
    ruleEngine = ruleEngineBuilder.initialise();
});

test('transfer data', () => {

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('42');
    expect(propC.getValue()).toBe(5);

    ruleEngine.transferData(propA, propB);

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('abc');
    expect(propC.getValue()).toBe(6);
});

test('transfering data triggers async derivations', () => {

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('42');

    ruleEngine.transferData(propA, propB);

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('abc');
    setTimeout(() => {
        expect(propD.isProcessing()).toBe(true);
    }, 0)
});

test('transfer data of incompatible types', () => {

    expect(propB.getValue()).toBe('42');
    expect(propBNumber.getValue()).toBe(0);

    // can be done by converting the exported value and then import it
    propBNumber.importData(Number.parseFloat(propB.exportData() ?? ''));

    expect(propB.getValue()).toBe('42');
    expect(propBNumber.getValue()).toBe(42);

    // but could also be achieved by getValue and setValue
    // however you might want to do this for property groups
});
