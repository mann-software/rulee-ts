import { builderAndRuleEngineFactory, emptyButRequiredMessageTestUtil, setupAsyncCrudList } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { executeAfterTime, valueAfterTime } from "./utils/timing-utils";
import { ValidationMessage } from "../validators/validation-message";
import { ValidationType } from "../validators/validation-type";
import { GateKeeper } from "./utils/gate-keeper";
import { rules } from "../rules/scalar-rules-definition";
import { arrayListRules } from "../rules/array-list-rules-definition";
import { listOfPropertiesRules } from "../rules/list-of-properties-rules-definition";
import { groupRules } from "../rules/group-of-properties-rules-definition";

let builder: Builder;
const someError: ValidationMessage = {
    text: 'Error',
    type: ValidationType.Error
};
const anotherError: ValidationMessage = {
    text: 'other Error',
    type: ValidationType.Error
};

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('scalar validation test', async () => {
    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addValidator()(p => p.getNonNullValue().length > 0 ? undefined : someError);
    }));

    let msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([someError]);
    expect(msgs).toStrictEqual([someError]);

    prop.setValue('Some Text');
    msgs = await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);
    expect(msgs).toStrictEqual([]);
});

test('scalar validation test with dependencies', async () => {
    const depProp = builder.scalar.stringProperty('DEPENDENCY_ PROP');

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addValidator(depProp)((self, depProp) => {
            const depPropValue = depProp.getValue();
            if (depPropValue) {
                return { text: depPropValue, type: ValidationType.Error };
            }
        });
    }));

    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);

    depProp.setValue('Some Value');
    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([{ text: 'Some Value', type: ValidationType.Error }]);
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
    let validationResult: ValidationMessage | undefined = undefined;

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addAsyncValidator()(() => valueAfterTime(validationResult, 50));
    }));

    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);

    validationResult = someError;
    prop.needsAnUpdate();
    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([someError]);
});

test('async scalar validation test with dependencies', async () => {
    const depProp = builder.scalar.stringProperty('DEPENDENCY_ PROP');

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addAsyncValidator(depProp)((self, depProp) => executeAfterTime(() => {
            const depPropValue = depProp.getValue();
            if (depPropValue) {
                return { text: depPropValue, type: ValidationType.Error };
            }
        }, 50));
    }));

    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([]);

    depProp.setValue('Some Value');
    await prop.validate();
    expect(prop.getValidationMessages()).toStrictEqual([{ text: 'Some Value', type: ValidationType.Error }]);
});

test('cancel validation test', async () => {
    const validationResult: ValidationMessage = someError;

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addAsyncValidator()(() => valueAfterTime(validationResult, 50));
    }));

    prop.needsAnUpdate();
    const validation = prop.validate();
    prop.clearValidationResult();
    expect(prop.getValidationMessages()).toStrictEqual([]);
    await validation;
    expect(prop.getValidationMessages()).toStrictEqual([]);
    expect(prop.isValid()).toBe(true);
});

test('set validation messages test (while validating)', async () => {
    const validationResult: ValidationMessage = someError;

    const prop = builder.scalar.stringProperty('PROP', {}, rules(builder => {
        builder.addAsyncValidator()(() => valueAfterTime(validationResult, 50));
    }));

    prop.needsAnUpdate();
    const validation = prop.validate();
    prop.setValidationMessages([anotherError]);
    expect(prop.getValidationMessages()).toStrictEqual([anotherError]);
    await validation;
    expect(prop.getValidationMessages()).toStrictEqual([anotherError]);
});

test('cross validator test', async () => {
    const guard = new GateKeeper(0);
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');

    builder.addCrossValidator(propA, propB)((propA, propB) => {
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
    expect(propA.getValidationMessages()).toStrictEqual([someError]);
    expect(guard.lastGatePassed).toBe(0);

    propA.setValue('Earth');
    const msgsA = await propA.validate();
    const msgsB = await propB.validate();
    expect(msgsA).toStrictEqual([someError, someError]);
    expect(msgsB).toStrictEqual([]);
    expect(guard.lastGatePassed).toBe(1);
});

test('cross validator test with cancellation', async () => {
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');

    builder.addCrossValidator(propA, propB)((propA, propB) => executeAfterTime(() => {
        if (propA.getNonNullValue().length + propB.getNonNullValue().length > 3) {
            return [someError];
        }
    }, 50));

    void propA.validate();
    const msgs = await propB.validate();
    expect(msgs).toStrictEqual([]);

    propA.setValue('Earth');
    const msgsA = propA.validate();
    const msgsB = propB.validate();
    propA.clearValidationResult(); // cancels also cross validation
    expect(await msgsA).toStrictEqual([]);
    expect(await msgsB).toStrictEqual([]);
    
    void propA.validate();
    await propB.validate();
    expect(propA.getValidationMessages()).toStrictEqual([someError]);
    expect(propB.getValidationMessages()).toStrictEqual([someError]);
});

test('validator list test', async () => {
    const list = builder.list.create('LIST', (id) => builder.scalar.booleanProperty(id));
    builder.list.bindListOfProperties(list, listOfPropertiesRules(builder => {
        builder.addValidator()((listProp) => {
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
        builder.addValidator()(l => {
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

    const hintFactory = (length: number) => ({
        text: `Length is ${length}`,
        type: ValidationType.Hint
    });

    const [list, id] = setupAsyncCrudList();
    builder.list.bindPropertyArrayList(list, arrayListRules(builder => {
        builder.addValidator()(list => {
            if (list.getElements().length > 1) {
                return someError;
            }
        }).addAsyncValidator()(list => executeAfterTime(() => {
            return hintFactory(list.length);
        }, 100));
    }));

    expect(list.getValidationMessages()).toStrictEqual([]);

    let msgs = await list.validate();
    let expected = [someError, hintFactory(list.length)]
    expect(msgs).toStrictEqual(expected);

    id.setValue('x');
    msgs = await list.validate();
    expected = [hintFactory(0)]
    expect(msgs).toStrictEqual(expected);
});

test('validator group test', async () => {
    const propA = builder.scalar.stringProperty('PROP_A');
    const propB = builder.scalar.stringProperty('PROP_B');
    const group = builder.group.of('GROUP', {
        propA,
        propB
    }, groupRules(builder => {
        builder.addCrossValidator((group) => executeAfterTime(() => {
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
