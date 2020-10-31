import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";
import { RuleEngine } from "../engine/rule-engine";

let builder: Builder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<string>;
let propC: PropertyScalar<number>;
let ruleEngine: RuleEngine;

beforeEach(() => {
    [builder, ruleEngine] = builderAndRuleEngineFactory();
    propA = builder.scalar.stringProperty('PROP_A');
    propB = builder.scalar.stringProperty('PROP_B');
    propC = builder.scalar.derived.sync('PROP_C', C.number.default, propA, propB)({
        derive: (propA, propB) => propA.getNonNullValue().length  + propB.getNonNullValue().length
    });
});

test('linking a property initially transfers the data', () => {

    propA.setDisplayValue('abc');

    // properties
    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('');
    expect(propC.getValue()).toBe(3);

    ruleEngine.linkPropertyData(propA, propB);

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('abc');
    expect(propC.getValue()).toBe(6);
});

test('linked properties are synchronised', () => {

    ruleEngine.linkPropertyData(propA, propB);
    
    propA.setDisplayValue('xy');
    expect(propA.getValue()).toBe('xy');

    setTimeout(() => { // TODO: avoid this 0-timeout
        expect(propB.getValue()).toBe('xy');
        expect(propC.getValue()).toBe(4);
        
        propB.setDisplayValue('qwerty');
    
        expect(propA.getValue()).toBe('qwerty');
        expect(propB.getValue()).toBe('qwerty');
        expect(propC.getValue()).toBe(12);
    })
});

test('unlinking a property works and the order of the key is not important', () => {

    ruleEngine.linkPropertyData(propA, propB);
    
    propB.setDisplayValue('qwerty');
    expect(propB.getValue()).toBe('qwerty');
    setTimeout(() => {
        expect(propA.getValue()).toBe('qwerty');
        expect(propC.getValue()).toBe(12);
    
        ruleEngine.unlinkPropertyData(propB, propA);
    
        expect(propA.getValue()).toBe('qwerty');
        expect(propB.getValue()).toBe('qwerty');
        expect(propC.getValue()).toBe(12);
        
        propA.setDisplayValue('mno');
    
        expect(propA.getValue()).toBe('mno');
        expect(propB.getValue()).toBe('qwerty');
        expect(propC.getValue()).toBe(9);
    })
});
