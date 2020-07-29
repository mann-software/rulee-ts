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
        private readonly propertyScalar: <T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: AbstractProperty<unknown>[], initialValue?: T | null) => PropertyScalarImpl<T>,
        private readonly bindPropertScalar: <T>(prop: PropertyScalar<T>) => PropertyScalarRuleBinding<T>
    ) {}

    defineTemplate<T>(prefix: string, factory: (scalarBuilder: PropertyScalarBuilder, id: PropertyId) => PropertyScalar<T>): PropertyTemplate<PropertyScalar<T>, T> {
        return (id: string) => factory(this, `${prefix}_${id}`);
    }
 
    isLike<T>(template: PropertyScalar<T>): PropertyScalar<T> {
        // TODO copy template
        return template;
    }

    simpleProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn): PropertyScalar<T> {
        return this.propertyScalar(id, new SimpleValueProvider<T>(), emptyValueFcn, valueConverter);
    }

    stringProperty(id: PropertyId, options?: { 
        valueConverter?: ValueConverter<string>;
        initialValue?: string | null;
    }): PropertyScalar<string> {
        return this.propertyScalar(id, new SimpleValueProvider<string>(),
            EmptyValueFcns.defaultEmptyValueFcn,
            options?.valueConverter ?? C.string.identity,
            undefined,
            options?.initialValue !== undefined ? options?.initialValue : ''
        );
    }

    numberProperty(id: PropertyId, options?: { 
        valueConverter?: ValueConverter<number>;
        zeroIsConsideredAsEmpty?: boolean;
        initialValue?: number | null;
    }): PropertyScalar<number> {
        return this.propertyScalar(id, new SimpleValueProvider<number>(),
            options?.zeroIsConsideredAsEmpty ? EmptyValueFcns.defaultEmptyValueFcn : EmptyValueFcns.numberEmptyValueFcn,
            options?.valueConverter ?? C.number.default,
            undefined,
            options?.initialValue !== undefined ? options?.initialValue : (options?.zeroIsConsideredAsEmpty ? 0 : null)
        );
    }

    booleanProperty(id: PropertyId, options?: { 
        valueConverter?: ValueConverter<boolean>;
        initialValue?: boolean | null;
    }): PropertyScalar<boolean> {
        return this.propertyScalar(id, new SimpleValueProvider<boolean>(),
            EmptyValueFcns.booleanEmptyValueFcn,
            options?.valueConverter ?? C.boolean.default,
            undefined,
            options?.initialValue
        );
    }

    dateProperty(id: PropertyId, options?: { 
        valueConverter?: ValueConverter<Date>;
        initialValue?: Date | null;
    }): PropertyScalar<Date> {
        return this.propertyScalar(id, new SimpleValueProvider<Date>(),
            EmptyValueFcns.defaultEmptyValueFcn,
            options?.valueConverter ?? C.date.iso,
            undefined,
            options?.initialValue
        );
    }

    choicesProperty<T>(id: PropertyId, choices: Choice<T>[], emptyChoice?: Choice<T>): PropertyScalar<T> {
        const provider = new ChoiceValueProvider<T>(emptyChoice?.value ?? null);
        const converter = new ChoiceValueConverter<T>(choices, emptyChoice);
        const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
        const prop = this.propertyScalar(id, provider, emptyValueFcn, converter);
        prop.defineInitialValue(emptyChoice?.value ?? choices[0]?.value);
        return prop;
    }

    objectProperty<T, O>(id: PropertyId, obj: O, get: (obj: O) => T | null, set: (obj: O, val: T | null) => void, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn): PropertyScalar<T> {
        return this.propertyScalar(id, new ObjectValueProvider(obj, get, set), emptyValueFcn, valueConverter);
    }

    objectPathProperty<T, O>(id: PropertyId, obj: O, path: string, valueConverter: ValueConverter<T>, emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn): PropertyScalar<T> {
        const get = (obj: O) => null; // TODO like lodash
        const set = (obj: O, val: T | null) => {
            // TODO like lodash
        };
        return this.propertyScalar(id, new ObjectValueProvider(obj, get, set), emptyValueFcn, valueConverter);
    }

    enviromentProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, value: T | (() => T), emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn): PropertyScalar<T> {
        let provider: ValueProvider<T>;
        if (value instanceof Function) {
            provider = new DerivedValueProvider<T>([], (deps) => value());
        } else {
            provider = new ConstantValueProvider<T>(value);
        }
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter);
    }

    derivedProperty1<T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>, dependency: D1, 
        derivations: {
            derive: (dep: D1) => T | null; 
            inverse?: (dep: D1, val: T | null) => void;
        },
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency];
        const invFcn = this.invFcn(derivations.inverse && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverse!(deps[0] as D1, val)));
        const provider = new DerivedValueProvider<T>(dependencies, (deps) => derivations.derive(deps[0] as D1), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    derivedProperty2<T, TD, D1 extends AbstractProperty<TD>, D2 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency1: D1, dependency2: D2, derivations: {
            derive: (dep1: D1, dep2: D2) => T | null;
            inverse?: (dep1: D1, dep2: D2, val: T | null) => void;
        },
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency1, dependency2];
        const invFcn = this.invFcn(derivations.inverse && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverse!(deps[0] as D1, deps[1] as D2, val)));
        const provider = new DerivedValueProvider<T>(dependencies, (deps) => derivations.derive(deps[0] as D1, deps[1] as D2), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    derivedAsyncProperty1<T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency: D1, derivations: {
            deriveAsync: (dep: D1) => Promise<T | null>;
            inverseAsync?: (dep: D1, val: T | null) => Promise<unknown>;
        },
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency];
        const invFcn = this.asycInvFcn(derivations.inverseAsync && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverseAsync!(deps[0] as D1, val)));
        const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => derivations.deriveAsync(deps[0] as D1), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    derivedAsyncProperty2<T, TD, D1 extends AbstractProperty<TD>, D2 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
        dependency1: D1, dependency2: D2, derivations: {
            deriveAsync: (dep: D1, dep2: D2) => Promise<T | null>;
            inverseAsync?: (dep: D1, dep2: D2, val: T | null) => Promise<unknown>;
        },
        emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
    ): PropertyScalar<T> {
        const dependencies = [dependency1, dependency2];
        const invFcn = this.asycInvFcn(derivations.inverseAsync && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverseAsync!(deps[0] as D1, deps[1] as D2, val)));
        const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => derivations.deriveAsync(deps[0] as D1, deps[1] as D2), invFcn);
        return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies);
    }

    bind<T>(prop: PropertyScalar<T>): PropertyScalarRuleBinding<T> {
        return this.bindPropertScalar(prop);
    }

    private invFcn<T, TD>(fcn?: (deps: AbstractProperty<TD>[], val: T | null) => void) {
        if (fcn) {
            return fcn as (deps: AbstractProperty<unknown>[], val: T | null) => void;
        }
    }

    private asycInvFcn<T, TD>(fcn?: (deps: AbstractProperty<TD>[], val: T | null) => Promise<unknown>) {
        if (fcn) {
            return fcn as (deps: AbstractProperty<unknown>[], val: T | null) => Promise<void>;
        }
    }

}
