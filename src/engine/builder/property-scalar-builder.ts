import { PropertyId } from "../../properties/property-id";
import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { AbstractProperty } from "../../properties/abstract-property";
import { ValueConverter } from "../../value-converter/value-converter";
import { SimpleValueProvider } from "../../provider/value-provider/simple-value-provider";
import { Choice } from "../../properties/choice";
import { ChoiceValueConverter } from "../../value-converter/choice-value-converter";
import { ChoiceValueProvider } from "../../provider/value-provider/choice-value-provider";
import { ValueProvider } from "../../provider/value-provider/value-provider";
import { ObjectValueProvider } from "../../provider/value-provider/object-value-provider";
import { C } from "../../value-converter/common-value-converters";
import { DerivedValueProvider } from "../../provider/value-provider/derived-value-provider";
import { DerivedAsyncValueProvider } from "../../provider/value-provider/derived-async-value-provider";
import { ConstantValueProvider } from "../../provider/value-provider/constant-value-provider";
import { PropertyScalarRuleBinding } from "./property-scalar-rule-binding";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { EmptyValueFcn, EmptyValueFcns } from "../../provider/value-provider/empty-value-fcn";

export class PropertyScalarBuilder {

    constructor(
        private propertyScalar: <T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: AbstractProperty<any>[]) => PropertyScalarImpl<T>,
        private bindPropertScalar: <T>(prop: PropertyScalar<T>) => PropertyScalarRuleBinding<T>
    ) {}

    defineTemplate<T>(prefix: string, factory: (scalarBuilder: PropertyScalarBuilder, id: PropertyId) => PropertyScalar<T>): PropertyTemplate<PropertyScalar<T>, T> {
        return (id: string) => factory(this, `${prefix}_${id}`);
    }
 
    isLike<T>(template: PropertyScalar<T>): PropertyScalar<T> {
        // TODO copy template
        return template;
    }

    simpleProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn): PropertyScalar<T> {
        return this.propertyScalar(id, new SimpleValueProvider<T>(), emptyValueFcn, valueConverter);
    }

    stringProperty(id: PropertyId, valueConverter?: ValueConverter<string>): PropertyScalar<string> {
        return this.propertyScalar(id, new SimpleValueProvider<string>(), EmptyValueFcns.DefaultEmptyValueFcn, valueConverter ?? C.string.identity);
    }

    numberProperty(id: PropertyId, valueConverter?: ValueConverter<number>, zeroIsConsideredAsEmpty = false): PropertyScalar<number> {
        return this.propertyScalar(id, new SimpleValueProvider<number>(),
            zeroIsConsideredAsEmpty ? EmptyValueFcns.DefaultEmptyValueFcn : EmptyValueFcns.NumberEmptyValueFcn,
            valueConverter ?? C.number.default
        );
    }

    choicesProperty<T>(id: PropertyId, choices: Choice<T>[], emptyChoice?: Choice<T>): PropertyScalar<T> {
        const provider = new ChoiceValueProvider<T>(emptyChoice?.value ?? null);
        const converter = new ChoiceValueConverter<T>(choices, emptyChoice);
        const emptyValueFcn = emptyChoice ? EmptyValueFcns.ChoiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.DefaultEmptyValueFcn;
        const prop = this.propertyScalar(id, provider, emptyValueFcn, converter);
        prop.defineInitialValue(emptyChoice?.value ?? choices[0]?.value);
        return prop;
    }

    objectProperty<T, O>(id: PropertyId, obj: O, get: (obj: O) => T | null, set: (obj: O, val: T | null) => void, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn): PropertyScalar<T> {
        return this.propertyScalar(id, new ObjectValueProvider(obj, get, set), emptyValueFcn, valueConverter);
    }

    objectPathProperty<T, O>(id: PropertyId, obj: O, path: string, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn): PropertyScalar<T> {
        const get = (obj: O) => null; // TODO like lodash
        const set = (obj: O, val: T | null) => { }; // TODO like lodash
        return this.propertyScalar(id, new ObjectValueProvider(obj, get, set), emptyValueFcn, valueConverter);
    }

    enviromentProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, value: T | (() => T), emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn): PropertyScalar<T> {
        let provider: ValueProvider<T>;
        if (value instanceof Function) {
            provider = new DerivedValueProvider<T>([], (deps) => value());
        } else {
            provider = new ConstantValueProvider<T>(value);
        }
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter);
    }

    derivedProperty1<T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency: D1, derive: (dep: D1) => T | null, inverse?: (dep: D1, val: T | null) => void, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency];
        const invFcn = inverse ? (deps: AbstractProperty<TD>[], val: T | null) => inverse(deps[0] as D1, val) : undefined;
        const provider = new DerivedValueProvider<T>(dependencies, (deps) => derive(deps[0] as D1), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    derivedProperty2<T, TD, D1 extends AbstractProperty<TD>, D2 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency1: D1, dependency2: D2, derive: (dep1: D1, dep2: D2) => T | null, inverse?: (dep1: D1, dep2: D2, val: T | null) => void,
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency1, dependency2];
        const invFcn = inverse ? (deps: AbstractProperty<TD>[], val: T | null) => inverse(deps[0] as D1, deps[1] as D2, val) : undefined;
        const provider = new DerivedValueProvider<T>(dependencies, (deps) => derive(deps[0] as D1, deps[1] as D2), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    derivedAsyncProperty1<T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency: D1, deriveAsync: (dep: D1) => Promise<T | null>, inverseAsync?: (dep: D1, val: T | null) => void,
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.DefaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency];
        const invFcn = inverseAsync ? (deps: AbstractProperty<TD>[], val: T | null) => inverseAsync(deps[0] as D1, val) : undefined;
        const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => deriveAsync(deps[0] as D1), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    bind<T>(prop: PropertyScalar<T>): PropertyScalarRuleBinding<T> {
        return this.bindPropertScalar(prop);
    }

}
