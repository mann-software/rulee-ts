import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { GroupOfPropertiesTemplate } from "../properties/factory/property-template";
import { DataTypeToPropertyGroup } from "../properties/abstract-data-property";

type SimpleModel = {
    aString: string;
    aBoolean: boolean;
    aNumber: number;
    aDate: Date;
}

type NestedModel = {
    simple: SimpleModel;
    bString: string;
}

let builder: Builder;
let simpleTemplate: GroupOfPropertiesTemplate<DataTypeToPropertyGroup<SimpleModel>>;
let nestedTemplate: GroupOfPropertiesTemplate<DataTypeToPropertyGroup<NestedModel>>;
const now = new Date();

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
    simpleTemplate = builder.group.template<DataTypeToPropertyGroup<SimpleModel>>(idFcn => {
        const aString = builder.scalar.stringProperty(idFcn('A_STRING'));
        const aBoolean = builder.scalar.booleanProperty(idFcn('A_BOOLEAN'));
        const aNumber = builder.scalar.numberProperty(idFcn('A_NUMBER'));
        const aDate = builder.scalar.dateProperty(idFcn('A_DATE'));
        return {
            aString,
            aBoolean,
            aNumber,
            aDate
        }
    });

    nestedTemplate = builder.group.template<DataTypeToPropertyGroup<NestedModel>>(idFcn => {
        const simple = simpleTemplate(idFcn('SIMPLE'));
        const bString = builder.scalar.stringProperty(idFcn('B_STRING'));
        return {
            simple,
            bString
        }
    });
});

test('group of properties with SimpleModel', () => {
    const group = simpleTemplate('GROUP');

    group.importData({
        aString: '',
        aNumber: 42,
        aBoolean: true,
        aDate: now
    });
    expect(group.properties.aString.getValue()).toBe('');
    expect(group.properties.aNumber.getValue()).toBe(42);
    expect(group.properties.aBoolean.getValue()).toBe(true);
    expect(group.properties.aDate.getValue()).toStrictEqual(now);

    group.properties.aString.setValue('abc');
    expect(group.exportData()).toStrictEqual({
        aString: 'abc',
        aNumber: 42,
        aBoolean: true,
        aDate: now
    });
});

test('group of properties with NestedModel', () => {
    const nested = nestedTemplate('NESTED');

    nested.importData({
        simple: {
            aString: '',
            aNumber: 42,
            aBoolean: true,
            aDate: now
        },
        bString: 'xyz'
    });
    expect(nested.properties.bString.getValue()).toBe('xyz');
    expect(nested.properties.simple.properties.aString.getValue()).toBe('');
    expect(nested.properties.simple.properties.aNumber.getValue()).toBe(42);
    expect(nested.properties.simple.properties.aBoolean.getValue()).toBe(true);
    expect(nested.properties.simple.properties.aDate.getValue()).toStrictEqual(now);
});
