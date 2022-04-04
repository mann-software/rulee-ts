
import { Builder } from "../engine/builder/builder";
import { SemanticVersionDataMigrator } from "../engine/data/data-migrator";
import { SemanticRulesVersion } from "../engine/data/rules-version";
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
    const itemTemplate = builder.group.template((idFcn, index) => ({
            propC: builder.scalar.numberProperty(idFcn('propC'), { initialValue: index?.idx ?? -1 })
        })
    );
    const list = builder.list.create('listA', itemTemplate);
    list.addProperty();
    list.addProperty();
    list.removePropertyAtIndex(0);

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
                propC: 1
            }]
        },
        rulesVersion: '1.3.2'
    });

    expect(engine.exportData([propA, list])).toStrictEqual({
        data: {
            propA: 'ABC',
            listA: [{
                propC: 1
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
                propC: 3
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
                propC: 3
            }]
        },
        rulesVersion: '1.3.2'
    });
});

test('import incompatible rule engine data', () => {
    const [builder, engine] = builderAndRuleEngineFactory({
        version: SemanticRulesVersion(1, 3, 2)
    });

    createProps(builder);

    const functionUnderTest = () => engine.importData({
        data: {
           some: 'data'
        },
        rulesVersion: '0.0.1'
    });
    expect(functionUnderTest).toThrowError();
});

test('import rule engine data using data migrators', () => {
    const [builder, engine] = builderAndRuleEngineFactory({
        version: SemanticRulesVersion(1, 3, 2),
        dataMigrators: [
            SemanticVersionDataMigrator({
                major: 0,
                minor: 12,
                patch: 4
            }, {
                major: 1,
                minor: 0,
                patch: 0
            },
            (old) => {
                const migrated = old.data;
                if (migrated['propB']) {
                    migrated['propB'] = (migrated['propB'] as number).toString();
                }
                return migrated;
            }),
            SemanticVersionDataMigrator({
                major: 1,
                minor: 0,
                patch: 5
            }, {
                major: 1,
                minor: 3,
                patch: 1
            },
            (old) => {
                const migrated = old.data;
                if (migrated['groupA']?.['renamed']) {
                    migrated['groupA']['propA'] = migrated['groupA']['renamed'];
                    delete migrated['groupA']['renamed'];
                }
                return migrated;
            }),
        ]
    });

    createProps(builder);

    engine.importData({
        data: {
            groupA: {
                renamed: 'XYZ'
            },
            propB: 456,
            listA: [{
                propC: 3
            }]
        },
        rulesVersion: '0.9.0'
    });

    expect(engine.exportData()).toStrictEqual({
        data: {
            groupA: {
                propA: 'XYZ'
            },
            propB: '456',
            listA: [{
                propC: 3
            }]
        },
        rulesVersion: '1.3.2'
    });
});
