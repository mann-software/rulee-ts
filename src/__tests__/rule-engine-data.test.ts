
import { Builder } from "../engine/builder/builder";
import { SemanticRulesVersion } from "../engine/data/rules-version";
import { ListIndex } from "../properties/lists/index/list-index";
import { builderAndRuleEngineFactory } from "./utils/test-utils";

const createProps = (builder: Builder) => {
    const propA = builder.scalar.stringProperty('propA', {
        initialValue: 'ABC'
    });
    const groupA = builder.group.of('groupA', {
        propA
    });
    const propB = builder.scalar.stringProperty('propB', {
        initialValue: '123'
    });
    const list = builder.list.create('listA', (id: string, index?: ListIndex) =>
        builder.group.of('groupB', {
            propC: builder.scalar.numberProperty('propC', { initialValue: index?.idx ?? -1 })
        })
    );
    list.addProperty();

    return { groupA, propA, propB, list };
}

test('export rule engine data', () => {
    const [builder, engine] = builderAndRuleEngineFactory({
        version: SemanticRulesVersion(1, 3, 2)
    });

    const { groupA, propA, propB, list } = createProps(builder);

    expect(engine.exportData()).toStrictEqual({
        data: {
            groupA: {
                propA: 'ABC'
            },
            propB: '123',
            listA: [{
                propC: 0
            }]
        },
        rulesVersion: '1.3.2'
    });

    expect(engine.exportData([propA, list])).toStrictEqual({
        data: {
            propA: 'ABC',
            listA: [{
                propC: 0
            }]
        },
        rulesVersion: '1.3.2'
    });
});

test('import rule engine data', () => {
    const [builder, engine] = builderAndRuleEngineFactory({
        version: SemanticRulesVersion(1, 3, 2)
    });

    createProps(builder);

    engine.importData({
        data: {
            groupA: {
                propA: 'XYZ'
            },
            propB: '456',
            listA: [{
                propC: 1
            }]
        },
        rulesVersion: '1.3.2'
    });

    expect(engine.exportData()).toStrictEqual({
        data: {
            groupA: {
                propA: 'XYZ'
            },
            propB: '456',
            listA: [{
                propC: 1
            }]
        },
        rulesVersion: '1.3.2'
    });
});
