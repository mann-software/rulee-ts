import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime } from "./utils/timing-utils";

let builder: Builder;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('add further rules later on while already in use - simple setup', () => {
    const propA = builder.scalar.stringProperty('PROP_A', { initialValue: 'A'});
    const propB = builder.scalar.derived.async('PROP_B', propA)(C.string.identity, {
        deriveAsync: (propA) => valueAfterTime(`B: ${propA.getDisplayValue()}`, 2000)
    });

    // now already use existing rule propB
    void propB.awaitValue();
    expect(propB.isProcessing()).toBe(true);

    // while propLaterOn is processing, define another rule that (indirectly) depends on propB
    const propLaterOn = builder.scalar.derived.async('PROP_LATER_ON', propB)(C.string.identity, {
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
    const propA = builder.scalar.stringProperty('PROP_A', { initialValue: 'A'});
    const propB = builder.scalar.derived.async('PROP_B', propA)(C.string.identity, {
        deriveAsync: (propA) => valueAfterTime(`B: ${propA.getDisplayValue()}`, 2000)
    });
    const propC = builder.scalar.derived.sync('PROP_C', propB)(C.string.identity, {
        derive: (propB) => `C: ${propB.getDisplayValue()}`
    });

    const propAA = builder.scalar.stringProperty('PROP_AA', { initialValue: 'AA'});
    const propBB = builder.scalar.derived.async('PROP_BB', propAA)(C.string.identity, {
        deriveAsync: (propAA) => valueAfterTime(`BB: ${propAA.getDisplayValue()}`, 1000)
    });

    // now already use existing rule propB
    void propB.awaitValue();
    expect(propB.isProcessing()).toBe(true);
    expect(propBB.isProcessing()).toBe(false);

    // while propB is processing, define another rule that (indirectly) depends on propB
    const propLaterOn = builder.scalar.derived.async('PROP_LATER_ON', propC, propBB)(C.string.identity, {
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
