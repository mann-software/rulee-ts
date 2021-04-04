import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { Builder } from "../engine/builder/builder";
import { SelectionMode } from "../engine/builder/list-builder";

let builder: Builder;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('list of property: add existing property', () => {
    const listItemTemplate = builder.scalar.template('ITEM', (scalarBuilder, id, index) => {
        const itemProp = scalarBuilder.stringProperty(id);
        scalarBuilder.bind(itemProp)
            .defineRequiredIfVisible()(() => !index || index.isFirst() || index.isSelected);
        return itemProp;
    });

    const propList = builder.list.create('PROP_LIST', listItemTemplate);

    expect(propList.exportData()).toStrictEqual([]);

    const propA = builder.scalar.stringProperty('PROP_A', { initialValue: '123' });
    propList.addProperty(propA);
    propList.addProperty();

    expect(propList.exportData()).toStrictEqual(['123', '']);

    propA.setValue('abc');
    // the property in the list is not synchronized with propA out of the box
    // this makes sense since most properties are assigned to an ui input
    // e.g. think of a list and a separate input group: after adding a new
    // element to the list you probably dont want to have them in sync
    // however if you need them to be in sync you could use RuleEngine.linkPropertyData
    expect(propList.exportData()).toStrictEqual(['123', '']);
    expect(propA.getValue()).toBe('abc');
    expect(propList.getProperty(0)?.id).toBe('PROP_LIST_0_ITEM');
    expect(propA.id).toBe('PROP_A');
    
    propList.setToInitialState();
    expect(propList.exportData()).toStrictEqual([]);
});

test('list of property: add properties and select property', () => {
    const listItemTemplate = builder.scalar.template('ITEM', (scalarBuilder, id, index) => {
        const itemProp = scalarBuilder.stringProperty(id);
        scalarBuilder.bind(itemProp)
            .defineRequiredIfVisible()(() => !index || index.isFirst() || index.isSelected);
        return itemProp;
    });
    const propList = builder.list.create('PROP_LIST', listItemTemplate);

    expect(propList.exportData()).toStrictEqual([]);

    propList.addPropertyData(['123', '456']);

    expect(propList.exportData()).toStrictEqual(['123', '456']);
    expect(propList.getProperty(0)?.isRequired()).toBe(true);
    expect(propList.getProperty(1)?.isRequired()).toBe(false);

    propList.selectPropertyAtIndex(1);
    expect(propList.getProperty(1)?.isRequired()).toBe(true);
});

test('list of property: select properties multiple properties and move properties around', () => {
    const listItemTemplate = builder.scalar.template('ITEM', (scalarBuilder, id, index) => {
        const itemProp = scalarBuilder.stringProperty(id);
        scalarBuilder.bind(itemProp)
            .defineRequiredIfVisible()(() => !!index?.isLast());
        return itemProp;
    });
    const propList = builder.list.create('PROP_LIST', listItemTemplate, SelectionMode.MultiSelect);
    propList.addProperties(3);

    expect(propList.getSelectedIndices()).toHaveLength(0);
    expect(propList.getSelectedProperty()).toBe(undefined);
    expect(propList.length).toBe(3);

    propList.getProperty(0)?.setValue('0');
    propList.getProperty(1)?.setValue('1');
    propList.getProperty(2)?.setValue('2');
    expect(propList.exportData()).toStrictEqual(['0', '1', '2']);

    propList.selectPropertyAtIndex(0);
    propList.selectProperty(propList.getProperty(1)!);

    expect(propList.getSelectedIndices()).toStrictEqual([0, 1]);
    expect(propList.getSelectedProperties()).toStrictEqual([
        { index: 0, property: propList.getProperty(0) },
        { index: 1, property: propList.getProperty(1) }
    ]);
    expect(propList.getSelectedProperty()).toStrictEqual(
        { index: 0, property: propList.getProperty(0) }
    );
    expect(propList.isPropertySelected(propList.getProperty(0)!)).toBe(true);
    expect(propList.isPropertySelectedAtIndex(1)).toBe(true);
    expect(propList.isPropertySelectedAtIndex(2)).toBe(false);
    expect(propList.isPropertySelectedAtIndex(3)).toBe(false); // does not exist and not selected

    propList.swapProperties(0, 2);
    expect(propList.getSelectedIndices()).toStrictEqual([1, 2]);
    expect(propList.exportData()).toStrictEqual(['2', '1', '0']);
    propList.moveProperty(1, 0);
    expect(propList.getSelectedIndices()).toStrictEqual([0, 2]);
    expect(propList.exportData()).toStrictEqual(['1', '2', '0']);
    propList.removePropertyAtIndex(0);
    expect(propList.getSelectedIndices()).toStrictEqual([1]);
    expect(propList.exportData()).toStrictEqual(['2', '0']);
    expect(propList.getProperty(1)?.isRequired()).toBe(true); // prop is last in list (see listItemTemplate)
    propList.addProperty();
    expect(propList.getSelectedIndices()).toStrictEqual([1]);
    expect(propList.exportData()).toStrictEqual(['2', '0', '']);
    expect(propList.getProperty(1)?.isRequired()).toBe(false);  // prop is not last in list any more
    expect(propList.getProperty(2)?.isRequired()).toBe(true);
    propList.swapProperties(2, 1);
    expect(propList.getSelectedIndices()).toStrictEqual([2]);
    expect(propList.exportData()).toStrictEqual(['2', '', '0']);
    propList.unselectAll();
    expect(propList.getSelectedIndices()).toStrictEqual([]);
});
