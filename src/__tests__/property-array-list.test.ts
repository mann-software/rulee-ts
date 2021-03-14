import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { valueAfterTime } from "./utils/timing-utils";

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

    const elements = await list.awaitElements();
    expect(elements).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);

    count.setValue(3);
    
    const promise = list.awaitElements().then(result => {
        expect(result).toStrictEqual([1, 2, 3]);
        expect(list.isProcessing()).toBe(false);
    });
    expect(list.isProcessing()).toBe(true);
    return promise;
});

