import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { PropertyScalar } from "../properties/property-scalar";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime, executeAfterTime } from "./utils/timing-utils";
import { InputComponentMock } from "./utils/input-component-mock";
import { GateKeeper } from "./utils/gate-keeper";

let builder: Builder;
let propA: PropertyScalar<string>;
let inputA: InputComponentMock;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
    propA = builder.scalar.stringProperty('PROP_A', { initialValue: '1' });
    inputA = new InputComponentMock(propA);
});

test('the default backpressure type is switch with debouncing', () => {
    const propB = builder.scalar.derived.async('PROP_B', C.string.identity, propA)({
        deriveAsync: (propA) => valueAfterTime(`<<${propA.getDisplayValue()}>>`, 100)
    });
    expect(propB.backpressureConfig?.type).toBe('switch');
    expect(propB.backpressureConfig?.debounceTime).toBeGreaterThan(0);
});

test('testing backpressure type switch with debouncing', async () => {
    const propB = builder.scalar.derived.async('PROP_B', C.string.identity, propA)({
        deriveAsync: (propA) => valueAfterTime(`<< ${propA.getDisplayValue()} >>`, 300),
        backpressureConfig: {
            type: 'switch',
            debounceTime: 150
        }
    });
    expect(propB.backpressureConfig?.type).toBe('switch');
    expect(propB.backpressureConfig?.debounceTime).toBe(150);
    const guard = new GateKeeper();

    inputA.registerBinding();
    const inputB = new InputComponentMock(propB);
    inputB.registerBinding();
    // just bound
    expect(propB.getValue()).toBe(null);
    expect(propB.isProcessing()).toBe(true);
    void propB.awaitValue().then(result => {
        guard.passGate(1);
        expect(result).toBe('<< 123 >>');
        // until this line of code, it would have been << 1 >>...
        // but user typewrites 2 and 3 and it is awaited, thus, switched to << 123 >>
    });

    await inputA.userTypewrites('2', '3');

    // change of inputA got switched
    void propB.awaitValue().then(result => {
        guard.passGate(2);
        expect(result).toBe('<< 123 >>');
    });

    await executeAfterTime(() => {
        guard.passGate(3);
        expect(propA.getValue()).toBe('123');
        expect(inputB.currentValue).toBe('<< 123 >>');
        expect(propB.getValue()).toBe('<< 123 >>');
        expect(propB.isProcessing()).toBe(false);
    }, 550);
    
    await inputA.userTypewrites('4', '5');

    return executeAfterTime(() => {
        expect(propA.getValue()).toBe('12345');
        expect(inputB.currentValue).toBe('<< 12345 >>');
        expect(propB.getValue()).toBe('<< 12345 >>');
        expect(propB.isProcessing()).toBe(false);
        expect(guard.lastGatePassed).toBe(3);
    }, 550);
});

test('testing backpressure type switch with debouncing - no switch if not awaited', async () => {
    const propB = builder.scalar.derived.async('PROP_B', C.string.identity, propA)({
        deriveAsync: (propA) => valueAfterTime(`<< ${propA.getDisplayValue()} >>`, 300),
        backpressureConfig: {
            type: 'switch',
            debounceTime: 150
        }
    });
    expect(propB.backpressureConfig?.type).toBe('switch');
    expect(propB.backpressureConfig?.debounceTime).toBe(150);
    const guard = new GateKeeper();

    void propB.awaitValue().then(result => {
        guard.passGate(1);
        expect(result).toBe('<< 1 >>');
        expect(propB.isProcessing()).toBe(false);
    });
    expect(propB.getValue()).toBe(null);
    expect(propB.isProcessing()).toBe(true);

    propA.setValue('123');
    // propB.awaitValue() not called -> no async update

    return executeAfterTime(() => {
        expect(propA.getValue()).toBe('123');
        expect(propB.getValue()).toBe('<< 1 >>');
        // propB.awaitValue() was not called, still << 1 >>
        expect(propB.isProcessing()).toBe(false);
        expect(guard.lastGatePassed).toBe(1);
    }, 550);
});

test('testing backpressure type skip', async () => {
    const propB = builder.scalar.derived.async('PROP_B', C.string.identity, propA)({
        deriveAsync: (propA) => valueAfterTime(`<< ${propA.getDisplayValue()} >>`, 200),
        backpressureConfig: {
            type: 'skip'
        }
    });
    expect(propB.backpressureConfig?.type).toBe('skip');
    const guard = new GateKeeper();

    inputA.registerBinding();
    const inputB = new InputComponentMock(propB);
    inputB.registerBinding();
    // just bound
    expect(propB.getValue()).toBe(null);
    expect(propB.isProcessing()).toBe(true);
    void propB.awaitValue().then(result => {
        guard.passGate(1);
        expect(result).toBe('<< 1 >>');
    });

    await inputA.userTypewrites('2', '3');

    // change of inputA should be skipped
    void propB.awaitValue().then(result => {
        guard.passGate(2);
        expect(result).toBe('<< 1 >>');
    });

    await executeAfterTime(() => {
        guard.passGate(3);
        expect(propA.getValue()).toBe('123');
        expect(inputB.currentValue).toBe('<< 1 >>');
        expect(propB.getValue()).toBe('<< 1 >>');
        expect(propB.isProcessing()).toBe(false);
    }, 300);
    
    await inputA.userTypewrites('4', '5');

    return executeAfterTime(() => {
        expect(propA.getValue()).toBe('12345');
        expect(inputB.currentValue).toBe('<< 1234 >>');
        expect(propB.getValue()).toBe('<< 1234 >>');
        expect(propB.isProcessing()).toBe(false);
        expect(guard.lastGatePassed).toBe(3);
    }, 300);
});
