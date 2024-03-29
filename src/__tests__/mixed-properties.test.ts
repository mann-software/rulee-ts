import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { C } from "../value-converter/common-value-converters";
import { ValidationType } from "../validators/validation-type";
import { rules } from "../rules/scalar-rules-definition";

let builder: Builder;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('array list with sum property', () => {
    const hint42 = {
        text: 'Greater 42',
        type: ValidationType.Hint
    };

    const arrayList = builder.list.crud.sync('LIST')<number>();
    const sumProp = builder.scalar.derived.sync('SUM', arrayList)(C.number.default, {
        derive: (list) => list.getElements().reduce((res, cur) => res + cur, 0)
    }, rules(builder => {
        builder.defineVisibility(arrayList)((sum, list) => sum.getNonNullValue() > arrayList.length)
            .addValidator()(sum => {
                if (sum.getNonNullValue() > 42) {
                    return hint42;
                }
            })
    }));

    expect(sumProp.getValue()).toBe(0);
    expect(sumProp.isVisible()).toBe(false);
    void sumProp.validate();
    expect(sumProp.getValidationMessages()).toStrictEqual([]);

    arrayList.addElement(7);

    expect(sumProp.getValue()).toBe(7);
    expect(sumProp.isVisible()).toBe(true);
    void sumProp.validate();
    expect(sumProp.getValidationMessages()).toStrictEqual([]);
    
    arrayList.addElement(40);

    expect(sumProp.getValue()).toBe(47);
    expect(sumProp.isVisible()).toBe(true);
    void sumProp.validate();
    expect(sumProp.getValidationMessages()).toStrictEqual([hint42]);

    arrayList.removeElement(0);

    expect(sumProp.getValue()).toBe(40);
    expect(sumProp.isVisible()).toBe(true);
    void sumProp.validate();
    expect(sumProp.getValidationMessages()).toStrictEqual([]);

    arrayList.updateElement(43, 0);

    expect(sumProp.getValue()).toBe(43);
    expect(sumProp.isVisible()).toBe(true);
    void sumProp.validate();
    expect(sumProp.getValidationMessages()).toStrictEqual([hint42]);
});

test('list of group properties with sum-property', () => {
    const template = builder.group.template((id, index) => {
        const propA = builder.scalar.numberProperty(id('PROP_A'), {}, rules(builder => {
            builder.defineVisibility()(() => (index?.idx ?? 0) % 2 === 0);
        }));
        const propB = builder.scalar.stringProperty(id('PROP_B'));
        return { propA, propB }
    });
    const propList = builder.list.create('PROP_LIST', template);
    const sumProp = builder.scalar.derived.sync('SUM', propList)(C.number.default, {
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
    const innerTemplate = builder.list.template('INNER_LIST', (listBuilder, id) => {
        return listBuilder.create(id, builder.scalar.template<boolean>('ELEMENT', (scalarBuilder, id, index, siblings) => {
            const prop = scalarBuilder.booleanProperty(id, {}, rules(builder => {
                builder.addValidator()(
                    (prop) => (!prop.getValue() || siblings?.everySibling((sibling, i) => i === index?.idx || !sibling.getValue())) ? undefined : {
                        text: 'At most one element is allowed to be true',
                        type: ValidationType.Error
                    }
                );
            }));
            
            return prop;
        }));
    });
    const outerList = builder.list.create('OUTER_LIST', innerTemplate);
    expect(outerList.exportData()).toStrictEqual([]);
    outerList.addProperties(2);
    expect(outerList.exportData()).toStrictEqual([[], []]);

    const atLeastOneTrue = builder.scalar.derived.sync('AT_LEAST_ONE_TRUE', outerList)(C.boolean.default, {
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
