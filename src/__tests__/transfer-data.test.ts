import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";
import { PropertyScalar } from "../properties/property-scalar";
import { valueAfterTime } from "./utils/timing-utils";

let builder: Builder;
let propA: PropertyScalar<string>;
let propB: PropertyScalar<string>;
let propBNumber: PropertyScalar<number>;
let propC: PropertyScalar<number>;
let propD: PropertyScalar<number>;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
    propA = builder.scalar.stringProperty('PROP_A', { initialValue: 'abc' });
    propB = builder.scalar.stringProperty('PROP_B', { initialValue: '42' });
    propBNumber = builder.scalar.numberProperty('PROP_B_NUMBER', { zeroIsConsideredAsEmpty: true });
    propC = builder.scalar.derived.sync('PROP_C', propA, propB)(C.number.default, {
        derive: (propA, propB) => propA.getNonNullValue().length + propB.getNonNullValue().length
    });
    propD = builder.scalar.derived.async('PROP_D', propB)(C.number.default, {
        deriveAsync: (propA) => valueAfterTime(propA.getNonNullValue().length, 40)
    });
});

test('transfer data', () => {

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('42');
    expect(propC.getValue()).toBe(5);

    propA.transferData(propB);

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('abc');
    expect(propC.getValue()).toBe(6);
});

test('transfering data triggers async derivations', () => {

    expect(propA.getValue()).toBe('abc');
    expect(propB.getValue()).toBe('42');

    propA.transferData(propB);

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
