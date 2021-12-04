import { ObjectValueProvider } from './object-value-provider';

interface ComplexType {
    a?: {
        c?: {
            d?: number;
        };
        f?: boolean;
    };
    b: string;
}

test('object value provider', () => {
    const obj: ComplexType = { a: { f: true }, b: 'abc' };
    const objValProv1 = new ObjectValueProvider<ComplexType, number>(obj,
        (obj) => obj?.a?.c?.d ?? null,
        (obj, val) => obj.a = { ...obj?.a, c: { ...obj?.a?.c, d: val ?? undefined } } // you may use lodash set for this
    );
    const objValProv2 = new ObjectValueProvider<ComplexType, string>(obj, (obj) => obj.b, (obj, val) => obj.b = val ?? '');

    expect(objValProv1.getValue()).toBe(null);
    objValProv1.setValue(42);
    expect(objValProv1.getValue()).toBe(42);
    expect(obj?.a?.c?.d).toBe(42);
    expect(obj?.a?.f).toBe(true);
    
    expect(objValProv2.getValue()).toBe('abc');
    objValProv2.setValue('');
    expect(objValProv2.getValue()).toBe('');
    expect(obj.b).toBe('');
});
