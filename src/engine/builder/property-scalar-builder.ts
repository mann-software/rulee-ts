import { PropertyId } from "../../properties/property-id";
import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { AbstractProperty } from "../../properties/abstract-property";
import { ValueConverter } from "../../value-converter/value-converter";
import { SimpleValueProvider } from "../../provider/value-provider/simple-value-provider";
import { Choice } from "../../properties/choice";
import { SelectValueConverter } from "../../value-converter/choices/select-value-converter";
import { ChoiceValueProvider } from "../../provider/value-provider/choices/choice-value-provider";
import { ValueProvider } from "../../provider/value-provider/value-provider";
import { ObjectValueProvider } from "../../provider/value-provider/object-value-provider";
import { C } from "../../value-converter/common-value-converters";
import { DerivedValueProvider } from "../../provider/value-provider/derived-value-provider";
import { DerivedAsyncValueProvider } from "../../provider/value-provider/derived-async-value-provider";
import { ConstantValueProvider } from "../../provider/value-provider/constant-value-provider";
import { PropertyScalarRuleBinding } from "./property-scalar-rule-binding";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { EmptyValueFcn, EmptyValueFcns } from "../../provider/value-provider/empty-value-fcn";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { ChoiceListConverter } from "../../value-converter/choices/choice-list-converter";
import { assertThat } from "../../util/assertions/assertions";
import { SelectValueProvider } from "../../provider/value-provider/choices/select-value-provider";
import { TypeaheadValueProvider } from "../../provider/value-provider/choices/typeahead-value-provider";
import { TypeaheadValueConverter } from "../../value-converter/choices/typeahead-value-converter";
import { PropertyScalarWithChoices, upgradeAsPropertyWithChoices } from "../../properties/property-scalar-with-choices";
import { ListIndex } from "../../properties/factory/list-index";

export class PropertyScalarBuilder {

    constructor(
        private readonly propertyScalar: <T>(
            id: PropertyId,
            provider: ValueProvider<T>,
            emptyValueFcn: EmptyValueFcn<T>,
            converter: ValueConverter<T>,
            dependencies?: AbstractProperty<unknown>[],
            initialValue?: T | null,
            backpressureConfig?: BackpressureConfig,
            ownedProperties?: AbstractProperty<unknown>[],
        ) => PropertyScalarImpl<T>,
        private readonly bindPropertScalar: <T>(prop: PropertyScalar<T>) => PropertyScalarRuleBinding<T>,
        private readonly defaultEmptyChoice: Choice<any> | undefined,
    ) {
        assertThat(() => !defaultEmptyChoice || defaultEmptyChoice.value === null, () => 'value of defaultEmptyChoice must be null to match every Choice<T>')
    }

    template<T>(id: string, factory: (scalarBuilder: PropertyScalarBuilder, id: PropertyId, index?: ListIndex) => PropertyScalar<T>): PropertyTemplate<PropertyScalar<T>, T> {
        return (prefix: string, index?: ListIndex) => factory(this, `${prefix}_${id}`, index);
    }

    isLike<T>(template: PropertyScalar<T>, valueProvider?: ValueProvider<T>): PropertyScalar<T> {
        // TODO copy template and set new value provider if preset else copy value provider too
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

    select = {
        static: <T>(id: PropertyId, choices: Choice<T>[], emptyChoice?: Choice<T>) => {
            if (!emptyChoice) {
                emptyChoice = this.defaultEmptyChoice;
            }
            const provider = new ChoiceValueProvider<T>(choices, emptyChoice);
            const converter = new SelectValueConverter<T>(choices, emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : choices[0]?.value);
            prop.setToInitialValue();
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        },

        derived1: <T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, dependency: D1, derivations: {
            derive: (dep: D1) => Choice<T>[];
        }, emptyChoice?: Choice<T>) => {
            const choicesSourceProperty = this.derived.sync1(`${id}__choices__`, new ChoiceListConverter<T>(), dependency, derivations);
            return this.select.withPropertySource(id, choicesSourceProperty, emptyChoice);
        },

        asyncDerived1: <T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, dependency: D1, derivations: {
            deriveAsync: (dep: D1) => Promise<Choice<T>[]>;
            backpressureConfig?: BackpressureConfig;
        }, emptyChoice?: Choice<T>) => {
            const choicesSourceProperty = this.derived.async1(`${id}__choices__`, new ChoiceListConverter<T>(), dependency, derivations);
            return this.select.withPropertySource(id, choicesSourceProperty, emptyChoice);
        },

        withPropertySource: <T>(id: PropertyId, choicesSource: PropertyScalar<Choice<T>[]>, emptyChoice?: Choice<T>) => {
            if (!emptyChoice) {
                emptyChoice = this.defaultEmptyChoice;
            }
            const provider = new SelectValueProvider<T>(choicesSource, emptyChoice);
            const converter = new SelectValueConverter<T>(() => choicesSource.getNonNullValue(), emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [choicesSource], undefined, undefined, [choicesSource]);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : choicesSource.getNonNullValue()[0]?.value);
            prop.setToInitialValue();
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        }
    }

    typeahead = {
        async: <T>(id: PropertyId, options: {
            fetchChoices: (currentText: string) => Promise<Choice<T>[]>;
            minimumTextLength?: number;
        }): PropertyScalarWithChoices<[T | null, string], T> => {
            const inputSourceProperty = this.stringProperty(`${id}__input__`);
            const choicesSourceProperty = this.derived.async1(`${id}__choices__`, new ChoiceListConverter<T>(), inputSourceProperty, {
                deriveAsync: (inputProperty) => {
                    const text = inputProperty.getNonNullValue();
                    if (options.minimumTextLength && text.length < options.minimumTextLength) {
                        return Promise.resolve([]);
                    }
                    return options.fetchChoices(text);
                }
            });
            return this.typeahead.withPropertySource(id, inputSourceProperty, choicesSourceProperty);
        },

        withPropertySource: <T>(id: PropertyId, inputSource: PropertyScalar<string>, choicesSource: PropertyScalar<Choice<T>[]>): PropertyScalarWithChoices<[T | null, string], T> => {
            const provider = new TypeaheadValueProvider<T>(inputSource, choicesSource);
            const converter = new TypeaheadValueConverter<T>();
            const emptyValueFcn: EmptyValueFcn<[T | null, string]> = (val) => val?.[0] == null;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [inputSource], undefined, undefined, [inputSource, choicesSource]);
            return upgradeAsPropertyWithChoices(prop, choicesSource);
        }
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

    derived = {
        sync1: <T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>, dependency: D1,
            derivations: {
                derive: (dep: D1) => T | null;
                inverse?: (dep: D1, val: T | null) => void;
            },
            emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
        ) => {
            const dependencies = [dependency];
            const invFcn = this.invFcn(derivations.inverse && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverse!(deps[0] as D1, val)));
            const provider = new DerivedValueProvider<T>(dependencies, (deps) => derivations.derive(deps[0] as D1), invFcn);
            return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies) as PropertyScalar<T>;
        },

        sync2: <T, TD, D1 extends AbstractProperty<TD>, D2 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
            dependency1: D1, dependency2: D2, derivations: {
                derive: (dep1: D1, dep2: D2) => T | null;
                inverse?: (dep1: D1, dep2: D2, val: T | null) => void;
            },
            emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
        ) => {
            const dependencies = [dependency1, dependency2];
            const invFcn = this.invFcn(derivations.inverse && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverse!(deps[0] as D1, deps[1] as D2, val)));
            const provider = new DerivedValueProvider<T>(dependencies, (deps) => derivations.derive(deps[0] as D1, deps[1] as D2), invFcn);
            return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies) as PropertyScalar<T>;
        },

        async0: <T>(id: PropertyId, valueConverter: ValueConverter<T>, derivations: {
                deriveAsync: () => Promise<T | null>;
                inverseAsync?: (val: T | null) => Promise<unknown>;
                backpressureConfig?: BackpressureConfig;
            },
            emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
        ) => {
            const dependencies: AbstractProperty<unknown>[] = [];
            const invFcn = this.asycInvFcn(derivations.inverseAsync && ((deps: AbstractProperty<unknown>[], val: T | null) => derivations.inverseAsync!(val)));
            const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => derivations.deriveAsync(), invFcn);
            return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies, undefined, derivations.backpressureConfig) as PropertyScalar<T>;
        },

        async1: <T, TD, D1 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
            dependency: D1, derivations: {
                deriveAsync: (dep: D1) => Promise<T | null>;
                inverseAsync?: (dep: D1, val: T | null) => Promise<unknown>;
                backpressureConfig?: BackpressureConfig;
            },
            emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
        ) => {
            const dependencies = [dependency];
            const invFcn = this.asycInvFcn(derivations.inverseAsync && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverseAsync!(deps[0] as D1, val)));
            const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => derivations.deriveAsync(deps[0] as D1), invFcn);
            return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies, undefined, derivations.backpressureConfig) as PropertyScalar<T>;
        },

        async2: <T, TD, D1 extends AbstractProperty<TD>, D2 extends AbstractProperty<TD>>(id: PropertyId, valueConverter: ValueConverter<T>,
            dependency1: D1, dependency2: D2, derivations: {
                deriveAsync: (dep: D1, dep2: D2) => Promise<T | null>;
                inverseAsync?: (dep: D1, dep2: D2, val: T | null) => Promise<unknown>;
                backpressureConfig?: BackpressureConfig;
            },
            emptyValueFcn: EmptyValueFcn<T> = EmptyValueFcns.defaultEmptyValueFcn
        ) => {
            const dependencies = [dependency1, dependency2];
            const invFcn = this.asycInvFcn(derivations.inverseAsync && ((deps: AbstractProperty<TD>[], val: T | null) => derivations.inverseAsync!(deps[0] as D1, deps[1] as D2, val)));
            const provider = new DerivedAsyncValueProvider<T>(dependencies, (deps) => derivations.deriveAsync(deps[0] as D1, deps[1] as D2), invFcn);
            return this.propertyScalar(id, provider, emptyValueFcn, valueConverter, dependencies, undefined, derivations.backpressureConfig) as PropertyScalar<T>;
        }
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
