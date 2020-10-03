import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";

let ruleBuilder: RuleBuilder;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();
});

test('list of group properties with sum-property', () => {
    const template = ruleBuilder.group.template((id, index) => {
        const propA = ruleBuilder.scalar.numberProperty(id('PROP_A'));
        ruleBuilder.scalar.bind(propA).defineVisibility(() => (index?.idx ?? 0) % 2 === 0);
        const propB = ruleBuilder.scalar.stringProperty(id('PROP_B'));
        return { propA, propB }
    });
    const propList = ruleBuilder.list.createList('PROP_LIST', template);
    const sumProp = ruleBuilder.scalar.derived.sync1('SUM', C.number.default, propList, {
        derive: (propList) => propList.list.reduce((res, item) => res + item.properties.propA.getNonNullValue(), 0)
    });

    expect(propList.exportData()).toStrictEqual([]);
    expect(sumProp.getValue()).toBe(0);
    propList.addPropertyData([
        { propA: 7, propB: '7'},
        { propA: 42, propB: '42'},
    ]);
    expect(propList.exportData()).toStrictEqual([
        { propA: 7, propB: '7'},
        { propA: 42, propB: '42'},
    ]);
    expect(propList.getProperty(0)?.properties.propA.isVisible()).toBe(true);
    expect(propList.getProperty(1)?.properties.propA.isVisible()).toBe(false);
    expect(sumProp.getValue()).toBe(49);
});
