import { ruleEngineBuilderFactory } from "./utils/test-utils";
import { RuleEngineBuilder } from "../engine/builder/rule-engine-buider";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime, executeAfterTime } from "./utils/timing-utils";
import { PropertyScalar } from "../properties/property-scalar";

let ruleEngineBuilder: RuleEngineBuilder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<number>;
let propC: PropertyScalar<boolean>;

beforeEach(() => {
    ruleEngineBuilder = ruleEngineBuilderFactory();

    propA = ruleEngineBuilder.scalar.stringProperty('PROP_A', { initialValue: 'abc' });

    propB = ruleEngineBuilder.scalar.derivedAsyncProperty1('PROP_B', C.number.default, propA, {
        deriveAsync: (propA) => valueAfterTime((propA.getDisplayValue() ?? '??').length, 100)
    });

    propC = ruleEngineBuilder.scalar.derivedAsyncProperty2('PROB_C', C.boolean.default, propA, propB, {
        deriveAsync: (propA, propB) => valueAfterTime(
            (propA.getDisplayValue() === 'abc' && propB.getDisplayValue() === '3') || null, 200
        )
    });

    ruleEngineBuilder.create();
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
    }, 150);

    // both props finished
    return executeAfterTime(() => {
        expect(propB.isProcessing()).toBe(false);
        expect(propC.isProcessing()).toBe(false);
        expect(propB.getValue()).toBe(3);
        expect(propC.getValue()).toBe(true);
    }, 350);
});

test('async derived properties only execute if needed', () => {

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
    }, 350);
});
