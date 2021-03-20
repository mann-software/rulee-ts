import { PropertyArrayListCrudAsync } from "../properties/property-array-list";
import { PropertyScalar } from "../properties/property-scalar";
import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { executeAfterTime, valueAfterTime } from "./utils/timing-utils";

test('load a list asynchronously and filter the list synchronously', async () => {
    const [builder] = builderAndRuleEngineFactory();
    const resources: Record<string, number[]> = {
        'a': [1, 2, 3, 4, 5, 6],
        'b': [5, 6, 7, 8]
    };

    const id = builder.scalar.stringProperty('RESOURCE_ID', { initialValue: 'a' });
    const asyncResource = builder.list.derived.async('LIST', id)<number>({
        derive: (id) => valueAfterTime(resources[id.getNonNullValue()], 200)
    });
    const filterEven = builder.scalar.booleanProperty('FILTER_EVEN', { initialValue: true });
    const filterOdd = builder.scalar.booleanProperty('FILTER_ODD', { initialValue: true });

    const filteredList = builder.list.derived.sync('FILTERED_LIST', asyncResource, filterEven, filterOdd)({
        derive: (resource, even, odd) => resource.getElements().filter(el => {
            const isEven = el % 2 === 0;
            return (isEven && even.getNonNullValue())
                || (!isEven && odd.getNonNullValue());
        })
    })

    expect(asyncResource.getElements()).toStrictEqual([]);
    expect(filteredList.getElements()).toStrictEqual([]);

    await asyncResource.awaitElements();
    expect(asyncResource.getElements()).toStrictEqual([1, 2, 3, 4, 5, 6]);
    expect(filteredList.getElements()).toStrictEqual([1, 2, 3, 4, 5, 6]);

    filterEven.setValue(false);
    expect(asyncResource.getElements()).toStrictEqual([1, 2, 3, 4, 5, 6]);
    expect(filteredList.getElements()).toStrictEqual([1, 3, 5]);

    id.setValue('b');
    await asyncResource.awaitElements();
    expect(asyncResource.getElements()).toStrictEqual([5, 6, 7, 8]);
    expect(filteredList.getElements()).toStrictEqual([5, 7]);

    filterEven.setValue(true);
    filterOdd.setValue(false);
    expect(filteredList.getElements()).toStrictEqual([6, 8]);
});

test('derived sync list test', () => {
    const [builder] = builderAndRuleEngineFactory();

    const count = builder.scalar.numberProperty('COUNT', { initialValue: 7 });
    const list = builder.list.derived.sync('LIST', count)({
        derive: (count) => Array.from({length: count.getNonNullValue()}, (v, i) => i + 1)
    });

    expect(list.getElements()).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);

    count.setValue(3);
    
    expect(list.getElements()).toStrictEqual([1, 2, 3]);
});

test('derived async list test', async () => {
    const [builder] = builderAndRuleEngineFactory();

    const count = builder.scalar.numberProperty('COUNT', { initialValue: 7 });
    const list = builder.list.derived.async('LIST', count)({
        derive: (count) => valueAfterTime(Array.from({length: count.getNonNullValue()}, (v, i) => i + 1), 200)
    });

    expect(list.isProcessing()).toBe(false);
    const elements = await list.awaitElements();
    expect(elements).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);

    count.setValue(3);
    
    const promise = list.awaitElements().then(result => {
        expect(result).toStrictEqual([1, 2, 3]);
        expect(list.isProcessing()).toBe(false);
        expect(list.getElements()).toStrictEqual([1, 2, 3]);
    });
    expect(list.isProcessing()).toBe(true);
    expect(list.getElements()).toStrictEqual([]);
    return promise;
});

test('crud list test', () => {
    const [builder] = builderAndRuleEngineFactory();
    const list = builder.list.crud.sync('LIST')<number>();

    expect(list.getElements()).toStrictEqual([]);

    list.addElement(3);
    expect(list.getElements()).toStrictEqual([3]);
    
    list.addElement(1, 0);
    expect(list.getElements()).toStrictEqual([1, 3]);

    list.updateElement(2, 1);
    expect(list.getElements()).toStrictEqual([1, 2]);

    list.removeElement(0);
    expect(list.getElements()).toStrictEqual([2]);

    list.removeElement(0);
    expect(list.getElements()).toStrictEqual([]);
});

test('crud list test with resource provider', () => {
    const resources: Record<string, number[]> = {
        'a': [1, 2, 3],
        'b': [5]
    };
    const [builder] = builderAndRuleEngineFactory();
    const id = builder.scalar.stringProperty('ID', { initialValue: 'a' });
    const list = builder.list.crud.sync('LIST', id)({
        resourceProvider: (id) => resources[id.getNonNullValue()] ?? []
    });

    expect(list.getElements()).toStrictEqual([1, 2, 3]);

    list.addElement(4);
    expect(list.getElements()).toStrictEqual([1, 2, 3, 4]);

    id.setValue('b');
    expect(list.getElements()).toStrictEqual([5]);

    id.setValue('a');
    expect(list.getElements()).toStrictEqual([1, 2, 3, 4]);
});

function setupAsyncCrudList(): [PropertyArrayListCrudAsync<number>, PropertyScalar<string>] {
    const resources: Record<string, number[]> = {
        'a': [1, 2, 3],
        'b': [5]
    };
    const [builder] = builderAndRuleEngineFactory();

    const id = builder.scalar.stringProperty('ID', { initialValue: 'a' });
    const list = builder.list.crud.async('LIST', id)<number>({
        getElements: (id) => valueAfterTime(resources[id.getNonNullValue()].slice() ?? [], 200),
        addElement: (data, index) => executeAfterTime(() => {
            if (index !== undefined) {
                resources[id.getNonNullValue()].splice(index, 0, data);
            } else {
                resources[id.getNonNullValue()].push(data);
            }
        }, 200),
        removeElement: (index) => executeAfterTime(() => {
            if (index % 2 === 1) {
                throw new Error("removeElement: sync error");
            } 
            resources[id.getNonNullValue()].splice(index, 1);
        }, 200),
        updateElement: (data, index) => executeAfterTime(() => {
            resources[id.getNonNullValue()].splice(index, 1, data);
        }, 200),
    });

    return [list, id];
}

test('async crud list test - base', async () => {
    const [list, id] = setupAsyncCrudList();

    expect(list.getElements()).toStrictEqual([]);

    list.addElement(4);
    expect(list.getElements()).toStrictEqual([]);

    await list.awaitRemovingElement(0);
    expect(list.getElements()).toStrictEqual([2, 3, 4]);

    list.updateElement(2, 1);
    list.updateElement(1, 0);
    expect(list.getElements()).toStrictEqual([1, 2, 4]);

    return list.awaitElements().then(elements => {
        expect(elements).toStrictEqual([1, 2, 4]);
    });
});

test('async crud list test - resource switching', async () => {
    const [list, id] = setupAsyncCrudList();

    await list.awaitAddingElement(4);
    expect(list.getElements()).toStrictEqual([1, 2, 3, 4]);

    id.setValue('b');
    expect(list.getElements()).toStrictEqual([]);
    const firstBElement = await list.awaitElement(0);
    expect(firstBElement).toBe(5);
    expect(list.getElements()).toStrictEqual([5]);

    id.setValue('a');
    return list.awaitElements().then(elements => {
        expect(elements).toStrictEqual([1, 2, 3, 4]);
    });
});

test('async crud list test - sync failed', async () => {
    const [list, id] = setupAsyncCrudList();

    expect(list.isProcessing()).toBe(false);
    const elementsPromise = list.awaitElements();
    expect(list.isProcessing()).toBe(true);
    await elementsPromise;
    expect(list.isProcessing()).toBe(false);
    expect(list.getElements()).toStrictEqual([1, 2, 3]);

    list.addElement(0, 0);
    expect(list.isProcessing()).toBe(true);
    expect(list.getElements()).toStrictEqual([0, 1, 2, 3]);

    list.updateElement(42, 1);
    expect(list.getElements()).toStrictEqual([0, 42, 2, 3]);

    list.removeElement(3); // sync will throw an error
    expect(list.getElements()).toStrictEqual([0, 42, 2]); // no sync error, yet

    list.addElement(7, 2); // this will be undone as well
    list.updateElement(11, 3);
    expect(list.getElements()).toStrictEqual([0, 42, 7, 11]); // no sync error, yet

    expect(list.isProcessing()).toBe(true);
    return list.awaitElements().then(elements => {
        expect(true).toBe(false); // sync should fail
    }).catch(err => {
        expect(err).toStrictEqual(new Error('removeElement: sync error'));
        expect(list.isProcessing()).toBe(false);
        expect(list.getElements()).toStrictEqual([0, 42, 2, 3]);
    });
});
