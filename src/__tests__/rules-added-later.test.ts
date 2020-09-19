import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime } from "./utils/timing-utils";

let ruleBuilder: RuleBuilder;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();
});

test('add further rules later on while already in use - simple setup', () => {
    const propA = ruleBuilder.scalar.stringProperty('PROP_A', { initialValue: 'A'});
    const propB = ruleBuilder.scalar.derived.async1('PROP_B', C.string.identity, propA, {
        deriveAsync: (propA) => valueAfterTime(`B: ${propA.getDisplayValue()}`, 2000)
    });

    // now already use existing rule propB
    void propB.awaitValue();
    expect(propB.isProcessing()).toBe(true);

    // while propLaterOn is processing, define another rule that (indirectly) depends on propB
    const propLaterOn = ruleBuilder.scalar.derived.async1('PROP_LATER_ON', C.string.identity, propB, {
        deriveAsync: (propB) => valueAfterTime(propB.getDisplayValue(), 50)
    });

    // now use propLaterOn that was defined later on
    void propLaterOn.awaitValue().then(val => {
        expect(val).toBe(propB.getDisplayValue());
    });
    // propB should be still processing, propLaterOn should not process since propLaterOn depends on propB
    expect(propB.isProcessing()).toBe(true);
    expect(propLaterOn.isProcessing()).toBe(false);
    // if propB finished, propLaterOn should start to process
    return propB.awaitValue().then(val => {
        expect(propB.isProcessing()).toBe(false);
        setTimeout(() => expect(propLaterOn.isProcessing()).toBe(true));
    });
});

test('add further rules later on while already in use - complex setup', () => {
    const propA = ruleBuilder.scalar.stringProperty('PROP_A', { initialValue: 'A'});
    const propB = ruleBuilder.scalar.derived.async1('PROP_B', C.string.identity, propA, {
        deriveAsync: (propA) => valueAfterTime(`B: ${propA.getDisplayValue()}`, 2000)
    });
    const propC = ruleBuilder.scalar.derived.sync1('PROP_C', C.string.identity, propB, {
        derive: (propB) => `C: ${propB.getDisplayValue()}`
    });

    const propAA = ruleBuilder.scalar.stringProperty('PROP_AA', { initialValue: 'AA'});
    const propBB = ruleBuilder.scalar.derived.async1('PROP_BB', C.string.identity, propAA, {
        deriveAsync: (propAA) => valueAfterTime(`BB: ${propAA.getDisplayValue()}`, 1000)
    });

    // now already use existing rule propB
    void propB.awaitValue();
    expect(propB.isProcessing()).toBe(true);
    expect(propBB.isProcessing()).toBe(false);

    // while propB is processing, define another rule that (indirectly) depends on propB
    const propLaterOn = ruleBuilder.scalar.derived.async2('PROP_LATER_ON', C.string.identity, propC, propBB, {
        deriveAsync: (propC, propBB) => valueAfterTime(`${propC.getDisplayValue()}|${propBB.getDisplayValue()}`, 50)
    });

    // now use propLaterOn that was defined later on
    void propLaterOn.awaitValue().then(val => {
        expect(val).toBe(`${propC.getDisplayValue()}|${propBB.getDisplayValue()}`);
    });
    // propB should be still processing, propBB should be processing as well now and propLaterOn should not process
    // (since propLaterOn depends indirectly on propB and directly on propBB)
    expect(propB.isProcessing()).toBe(true);
    expect(propBB.isProcessing()).toBe(true);
    expect(propLaterOn.isProcessing()).toBe(false);
    // if propBB finished, propLaterOn should still wait on propB
    void propBB.awaitValue().then(val => {
        expect(propB.isProcessing()).toBe(true);
        expect(propBB.isProcessing()).toBe(false);
        setTimeout(() => expect(propLaterOn.isProcessing()).toBe(false));
    });
    // if propB finished, propLaterOn should start to process
    return propB.awaitValue().then(val => {
        expect(propB.isProcessing()).toBe(false);
        expect(propBB.isProcessing()).toBe(false);
        setTimeout(() => expect(propLaterOn.isProcessing()).toBe(true));
    });
});
