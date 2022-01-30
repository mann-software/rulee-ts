import { builderAndRuleEngineFactory, emptyButRequiredMessageTestUtil, setupAsyncCrudList } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { executeAfterTime, valueAfterTime } from "./utils/timing-utils";
import { ValidationMessage } from "../validators/validation-message";
import { ValidationType } from "../validators/validation-type";
import { GateKeeper } from "./utils/gate-keeper";
import { rules } from "../rules/scalar-rules-definition";
import { arrayListRules } from "../rules/array-list-rules-definition";
import { listOfPropertiesRules } from "../rules/list-of-properties-rules-definition";
import { groupRules } from "..";

let builder: Builder;
const someError: ValidationMessage = {
    text: 'Error',
    type: ValidationType.Error
};

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('scalar validation test', async () => {
    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addValidator(p => p.getNonNullValue().length > 0 ? undefined : someError);
    }));

    let msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([someError]);
    expect(msgs).toStrictEqual([someError]);

    prop.setValue('Some Text');
    msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);
    expect(msgs).toStrictEqual([]);
});

test('required if visible validation test', async () => {
    const propVis = builder.scalar.booleanProperty('PROP_VIS', {
        initialValue: true
    });

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.setRequiredIfVisible(true)
            .defineVisibility(propVis)((self, propVis) => propVis.getNonNullValue());
    }));

    prop.setValue('');
    let msgs = await prop.validate();
    expect(msgs).toStrictEqual([emptyButRequiredMessageTestUtil]);

    prop.setValue('Not empty anymore');
    msgs = await prop.validate();
    expect(msgs).toStrictEqual([]);

    prop.setValue('');
    propVis.setValue(false);
    msgs = await prop.validate();
    expect(msgs).toStrictEqual([]);
});

test('async scalar validation test', async () => {
    const validationResult: ValidationMessage[] = [];

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addAsyncValidator(() => valueAfterTime(validationResult, 50));
    }));

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
    builder.list.bindListOfProperties(list, listOfPropertiesRules(builder => {
        builder.addValidator((listProp) => {
            if (listProp.list.every(prop => !prop.getValue())) {
                return someError;
            }
        });
    }));

    let msgs = await list.validate();
    expect(msgs).toStrictEqual([someError]);

    list.addPropertyData([true]);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([]);

    list.getProperty(0)?.setValue(false);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([someError]);
});

test('validator sync array list test', async () => {
    const list = builder.list.crud.sync('LIST')<number>({}, arrayListRules(builder => {
        builder.addValidator(l => {
            if (l.getElements().length > 1) {
                return someError;
            }
        });
    }));

    let msgs = await list.validate();
    expect(msgs).toStrictEqual([]);

    list.addElement(1);
    list.addElement(2);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([someError]);
    expect(list.getValidationMessages()).toStrictEqual([someError]);

    list.removeElement(0);
    msgs = await list.validate();
    expect(msgs).toStrictEqual([]);
    expect(list.getValidationMessages()).toStrictEqual([]);
});

test('validator async array list test', async () => {

    const hintFactory = (length: number) => [
        {
            text: `Length is ${list.length}`,
            type: ValidationType.Hint
        }, {
            text: 'Just a Hint',
            type: ValidationType.Hint
        }
    ];

    const [list, id] = setupAsyncCrudList();
    builder.list.bindPropertyArrayList(list, arrayListRules(builder => {
        builder.addValidator(list => {
            if (list.getElements().length > 1) {
                return someError;
            }
        }).addAsyncValidator(list => executeAfterTime(() => {
            return hintFactory(list.length);
        }, 100));
    }));

    expect(list.getValidationMessages()).toStrictEqual([]);

    let msgs = await list.validate();
    expect(msgs).toStrictEqual([someError, ...hintFactory(6)]);

    id.setValue('x');
    msgs = await list.validate();
    expect(msgs).toStrictEqual(hintFactory(0));
});

test('validator group test', async () => {
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');
    const group = builder.group.of('GROUP', {
        propA,
        propB
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    }, groupRules(builder => {
        builder.addGeneralValidator((group) => executeAfterTime(() => {
            if (`${group.propA.getDisplayValue()}+${group.propB.getDisplayValue()}` === 'A+B') {
                return [someError];
            }
        }, 50));
    }));

    let msgs = await group.validate();
    expect(msgs).toStrictEqual([]);

    propA.setValue('A');
    propB.setValue('B');
    msgs = await group.validate();
    expect(msgs).toStrictEqual([someError]);
});
