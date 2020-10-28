import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { PropertyScalar } from "../properties/property-scalar";
import { C } from "../value-converter/common-value-converters";
import { valueAfterTime } from "./utils/timing-utils";
import { InputComponentMock } from "./utils/input-component-mock";

let ruleBuilder: RuleBuilder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<string>;
let propC: PropertyScalar<string>;
let inputA: InputComponentMock;
let inputB: InputComponentMock;
let inputC: InputComponentMock;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();

    propA = ruleBuilder.scalar.stringProperty('PROP_A', { initialValue: '1' });
    inputA = new InputComponentMock(propA);

    propB = ruleBuilder.scalar.derived.sync('PROP_B', C.string.identity, propA)({
        derive: (propA) => `< ${propA.getDisplayValue()} >`
    });
    inputB = new InputComponentMock(propB);

    propC = ruleBuilder.scalar.derived.async('PROP_C', C.string.identity, propA)({
        deriveAsync: (propA) => valueAfterTime(`<< ${propA.getDisplayValue()} >>`, 100)
    });
    inputC = new InputComponentMock(propC);
});

function check<T>(prop: PropertyScalar<T>, input: InputComponentMock, value: T, processing: boolean) {
    expect(input.currentValue).toBe(value);
    expect(prop.getDisplayValue()).toBe(value);
    if (processing) {
        expect(input.processing).toBe(true);
    } else {
        expect(input.processing).not.toBe(true);
    }
}

test('Bind input component test with simple value', async () => {
    expect(inputA.currentValue).toBe('');

    inputA.registerBinding();

    expect(inputA.visible).toBe(true);
    expect(inputA.readonly).toBe(false);
    expect(inputA.valid).toBe(true);
    check(propA, inputA, '1', false);

    await inputA.userTypewrites('2', '3');
    check(propA, inputA, '123', false);
    
    await inputA.userBackspace();
    check(propA, inputA, '12', false);

    // propB and propC were not bound, thus, they did not update
    check(propC, inputC, '', false);
    expect(inputB.currentValue).toBe('');
    // since propB is a synchronous property, it immediately updates by calling getDisplayValue
    expect(propB.getDisplayValue()).toBe('< 12 >');
});

test('Bind input component test with simple and synchronous derived values', async () => {
    expect(inputA.currentValue).toBe('');
    expect(inputB.currentValue).toBe('');

    inputA.registerBinding();
    inputB.registerBinding();
    check(propA, inputA, '1', false);
    check(propB, inputB, '< 1 >', false);

    await inputA.userTypewrites('2', '3');
    check(propA, inputA, '123', false);
    check(propB, inputB, '< 123 >', false);

    // propC was not bound, thus, it did not update
    check(propC, inputC, '', false);
});

test('Bind input component test with simple and derived values (sync and async)', async () => {
    expect(inputA.currentValue).toBe('');
    expect(inputB.currentValue).toBe('');
    expect(inputC.currentValue).toBe('');

    inputA.registerBinding();
    inputB.registerBinding();
    inputC.registerBinding();

    check(propA, inputA, '1', false);
    check(propB, inputB, '< 1 >', false);
    // propC was bound and starts to process since it is implemented that way in InputComponentMock
    check(propC, inputC, '', true);

    await propC.awaitDisplayValue();
    check(propC, inputC, '<< 1 >>', false);

    await inputA.userTypewrites('2'); // only '2' - backpressure test is in separat test file
    check(propA, inputA, '12', false);
    check(propB, inputB, '< 12 >', false);
    check(propC, inputC, '<< 1 >>', true);

    await propC.awaitDisplayValue();
    check(propC, inputC, '<< 12 >>', false);
});

test('Unbind and Rebind input component test', async () => {
    inputA.registerBinding();
    inputB.registerBinding();
    inputC.registerBinding();

    await propC.awaitDisplayValue();
    await inputA.userTypewrites('2');
    check(propA, inputA, '12', false);
    check(propB, inputB, '< 12 >', false);
    check(propC, inputC, '<< 1 >>', true);

    inputC.unregisterBinding();
    await propC.awaitDisplayValue();
    // propC was already processing and updated to current value
    // but inputC did not notice since propC is already unbound
    expect(inputC.currentValue).toBe('<< 1 >>');
    expect(propC.getDisplayValue()).toBe('<< 12 >>');
    
    await inputA.userTypewrites('3');
    // propC is still not bound to inputC -> no update happens
    expect(inputC.currentValue).toBe('<< 1 >>');
    expect(propC.getDisplayValue()).toBe('<< 12 >>');
    expect(propC.isProcessing()).toBe(false);

    check(propA, inputA, '123', false);
    inputC.registerBinding();
    // after propC is bound to inputC again
    // inputC got current display of propC and propC is updating
    // since it needsAnUpdate since dependency propA previously changed to '123'
    check(propC, inputC, '<< 12 >>', true);

    await propC.awaitDisplayValue();
    check(propC, inputC, '<< 123 >>', false);
});
