import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { executeAfterTime, valueAfterTime } from "./utils/timing-utils";
import { ValidationMessage } from "../validators/validation-message";
import { ValidationTypes } from "../validators/validation-type";
import { GateKeeper } from "./utils/gate-keeper";

let builder: Builder;
const someError: ValidationMessage = {
    text:'Error',
    type: ValidationTypes.Error
};

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('scalar validation test', async () => {
    const prop = builder.scalar.stringProperty('PROP');
    builder.scalar.bind(prop).addValidator(p => p.getNonNullValue().length > 0 ? undefined : someError);
    
    let msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([someError]);

    prop.setValue('Some Text');
    msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);
});

test('async scalar validation test', async () => {
    const validationResult: ValidationMessage[] = [];

    const prop = builder.scalar.stringProperty('PROP');
    builder.scalar.bind(prop).addAsyncValidator(() => valueAfterTime(validationResult, 50));

    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);

    validationResult.push(someError);
    prop.needsAnUpdate();
    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([someError]);
});

test('validator combination test', async () => {
    const guard = new GateKeeper(0);
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');
    
    builder.bindValidator(propA, propB)((propA, propB) => {
        guard.passGate();
        if (propA.getNonNullValue().length + propB.getNonNullValue().length < 3) {
            return [someError];
        } else if (propA.getNonNullValue().startsWith('E')) {
            return valueAfterTime({
                [propA.id]: [someError, someError]
            }, 50)
        }
    });

    void propA.validate();
    const msgs = await propB.validate();
    expect(msgs).toStrictEqual([someError]);
    expect(guard.lastGatePassed).toBe(0);

    propA.setValue('Earth');
    const msgsA = await propA.validate();
    const msgsB = await propB.validate();
    expect(msgsA).toStrictEqual([someError, someError]);
    expect(msgsB).toStrictEqual([]);
    expect(guard.lastGatePassed).toBe(1);
});

test('validator list test', async () => {
    const list = builder.list.create('LIST', (id) => builder.scalar.booleanProperty(id));
    builder.list.bindListOfProperties(list).addValidator((listProp) => {
        if (listProp.list.every(prop => !prop.getValue())) {
            return someError;
        }
    });

    let msgs = await list.validate();
    expect(msgs).toStrictEqual([someError]);

    list.addPropertyData([true]);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([]);

    list.getProperty(0)?.setValue(false);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([someError]);
});

test('validator group test', async () => {
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');
    const group = builder.group.of('GROUP', {
        propA,
        propB
    })

    builder.group.bindValidator(group, (group) => executeAfterTime(() => {
        if (`${group.propA.getDisplayValue()}+${group.propB.getDisplayValue()}` === 'A+B') {
            return [someError];
        }
    }, 50));

    let msgs = await group.validate();
    expect(msgs).toStrictEqual([]);

    propA.setValue('A');
    propB.setValue('B');
    msgs = await group.validate();
    expect(msgs).toStrictEqual([someError]);
});
