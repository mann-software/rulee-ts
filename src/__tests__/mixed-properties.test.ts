import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";
import { ValidationError } from "../validators/validation-type";

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
    const propList = ruleBuilder.list.create('PROP_LIST', template);
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

test('list of lists', async () => {
    const innerTemplate = ruleBuilder.list.template('INNER_LIST', (listBuilder, id) => {
        return listBuilder.create(id, ruleBuilder.scalar.template<boolean>('ELEMENT', (scalarBuilder, id, index, siblings) => {
            const prop = scalarBuilder.booleanProperty(id);
            scalarBuilder.bind(prop).addScalarValidator({
                validate: (prop) => (!prop.getValue() || siblings?.everySibling((sibling, i) => i === index?.idx || !sibling.getValue())) ? null : {
                    text: 'At most one element is allowed to be true',
                    type: ValidationError
                }
            });
            return prop;
        }));
    });
    const outerList = ruleBuilder.list.create('OUTER_LIST', innerTemplate);
    expect(outerList.exportData()).toStrictEqual([]);
    outerList.addProperties(2);
    expect(outerList.exportData()).toStrictEqual([[], []]);

    const atLeastOneTrue = ruleBuilder.scalar.derived.sync1('AT_LEAST_ONE_TRUE', C.boolean.default, outerList, {
        derive: (outerList) => outerList.list.some(innerList => innerList.list.some(element => element.getNonNullValue()))
    });
    expect(atLeastOneTrue.getValue()).toBe(false);

    outerList.getProperty(0)?.addPropertyData([true, true]);
    expect(outerList.exportData()).toStrictEqual([[true, true], []]);
    expect(atLeastOneTrue.getValue()).toBe(true);
    const firstElement = outerList.getProperty(0)?.getProperty(0);
    expect(firstElement?.getValidationMessages()).toHaveLength(0);
    await firstElement!.validate();
    expect(firstElement?.getValidationMessages()).toHaveLength(1);
    expect(firstElement?.getValidationMessages()[0].text).toBe('At most one element is allowed to be true');
});
