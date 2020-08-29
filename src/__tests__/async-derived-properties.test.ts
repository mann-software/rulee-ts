import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime, executeAfterTime } from "./utils/timing-utils";
import { PropertyScalar } from "../properties/property-scalar";

let ruleBuilder: RuleBuilder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<number>;
let propC: PropertyScalar<boolean>;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();

    propA = ruleBuilder.scalar.stringProperty('PROP_A', { initialValue: 'abc' });

    propB = ruleBuilder.scalar.derivedAsyncProperty1('PROP_B', C.number.default, propA, {
        deriveAsync: (propA) => valueAfterTime(propA.getDisplayValue().length, 1000)
    });

    propC = ruleBuilder.scalar.derivedAsyncProperty2('PROB_C', C.boolean.default, propA, propB, {
        deriveAsync: (propA, propB) => valueAfterTime(
            (propA.getDisplayValue() === 'abc' && propB.getDisplayValue() === '3') || null, 2000
        )
    });
});

test('async derived properties work', () => {

    // initial
    expect(propB.isProcessing()).toBe(false);
    expect(propC.isProcessing()).toBe(false);
    expect(propA.getDisplayValue()).toBe('abc');
    expect(propB.getValue()).toBe(null);
    expect(propC.getValue()).toBe(null);

    // await the processing of the value
    void propC.awaitValue().then(value => {
        expect(propA.getDisplayValue()).toBe('abc');
        expect(propB.getValue()).toBe(3);
        expect(propC.getValue()).toBe(value);
        expect(value).toBe(true);
        expect(propC.isProcessing()).toBe(false);
    });

    // propC requires propB, thus, it is not processing, yet
    expect(propB.isProcessing()).toBe(true);
    expect(propC.isProcessing()).toBe(false);
    expect(propB.getValue()).toBe(null);
    expect(propC.getValue()).toBe(null);

    // propB finished and propB is processing, now
    void executeAfterTime(() => {
        expect(propB.isProcessing()).toBe(false);
        expect(propC.isProcessing()).toBe(true);
        expect(propB.getValue()).toBe(3);
        expect(propC.getValue()).toBe(null);
    }, 1500);

    // both props finished
    return executeAfterTime(() => {
        expect(propB.isProcessing()).toBe(false);
        expect(propC.isProcessing()).toBe(false);
        expect(propB.getValue()).toBe(3);
        expect(propC.getValue()).toBe(true);
    }, 3500);
});

test('async derived properties are only processing if needed', () => {

    void propC.awaitValue().then(() => {
        // the next time it resolves immediately since no dependeny changed
        let resolved = false;
        void propC.awaitValue().then(() => resolved = true);
        expect(propB.isProcessing()).toBe(false);
        expect(propC.isProcessing()).toBe(false);
        setTimeout(() => { // set zero timeout to execte after `then` has executed 
            expect(resolved).toBe(true);

            // now it needs to derive the value again since a dependeny changed
            propA.setValue('xy');
            resolved = false;
            void propC.awaitValue().then(() => resolved = true);
            expect(propB.isProcessing()).toBe(true);
            expect(propC.isProcessing()).toBe(false);
            setTimeout(() => expect(resolved).toBe(false), 0);
        }, 0);

    });

    // was triggered first time
    expect(propB.isProcessing()).toBe(true);
    expect(propC.isProcessing()).toBe(false);

    return executeAfterTime(() => {
        // was triggered second time
        expect(propB.isProcessing()).toBe(true);
        expect(propC.isProcessing()).toBe(false);
    }, 3500);
});

test('async derived properties are only processing if needed - part II', () => {

    // when awaiting value of propB, propC will not be derived
    void propB.awaitValue();

    // propB should be processing
    expect(propB.isProcessing()).toBe(true);
    expect(propC.isProcessing()).toBe(false);

    return executeAfterTime(() => {
        // propC is should not be processing since its value was not requested
        expect(propB.isProcessing()).toBe(false);
        expect(propC.isProcessing()).toBe(false);
    }, 1500);
});

test('getValue should NOT start async processing but awaitValue should do if needed', () => {

    expect(propB.isProcessing()).toBe(false);
    propB.getValue();
    expect(propB.isProcessing()).toBe(false);
    void propB.awaitValue();
    expect(propB.isProcessing()).toBe(true);

    return executeAfterTime(() => {
        expect(propB.isProcessing()).toBe(false);
        expect(propB.getValue()).toBe(3);
    }, 1500);
});

test('awaiting a display value also works', async () => {
    const displayValue = await propB.awaitDisplayValue();
    expect(displayValue).toBe('3');
    expect(propB.getDisplayValue()).toBe(displayValue);
    expect(propB.isProcessing()).toBe(false);
});
