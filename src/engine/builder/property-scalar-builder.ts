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
import { PropertyScalarRuleBinding } from "./property-scalar-rule-binding";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { EmptyValueFcn, EmptyValueFcns } from "../../provider/empty-value-fcn";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { ChoiceListConverter } from "../../value-converter/choices/choice-list-converter";
import { assertThat } from "../../util/assertions/assertions";
import { SelectValueProvider } from "../../provider/value-provider/choices/select-value-provider";
import { TypeaheadValueProvider } from "../../provider/value-provider/choices/typeahead-value-provider";
import { TypeaheadValueConverter } from "../../value-converter/choices/typeahead-value-converter";
import { PropertyScalarWithChoices, upgradeAsPropertyWithChoices } from "../../properties/property-scalar-with-choices";
import { ListIndex } from "../../properties/lists/index/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { Rule } from "../../rules/rule";
import { PropertyConfig } from "./builder-options";
import { PropertyArrayListReadonly } from "../../properties/property-array-list";
import { ListBuilder } from "./list-builder";

export interface PropertyScalarValueConfig<T> extends PropertyConfig {
    valueConverter?: ValueConverter<T>;
    initialValue?: T | null;
    emptyValueFcn?: EmptyValueFcn<T>;
}

export class PropertyScalarBuilder {

    constructor(
        private readonly propertyScalar: <T>(
            id: PropertyId,
            provider: ValueProvider<T>,
            emptyValueFcn: EmptyValueFcn<T>,
            converter: ValueConverter<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyScalarValueConfig<T> & { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyScalarImpl<T>,
        private readonly bindPropertyScalar: <T>(prop: PropertyScalar<T>) => PropertyScalarRuleBinding<T>,
        private readonly defaultEmptyChoiceDisplayValue: string | undefined,
        private readonly listBuilder: ListBuilder,
    ) { }

    template<D>(id: string, factory: (scalarBuilder: PropertyScalarBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<PropertyScalar<D>>) => PropertyScalar<D>): PropertyTemplate<PropertyScalar<D>, D> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<PropertyScalar<D>>) => factory(this, `${prefix}_${id}`, index, siblingAccess);
    }

    isLike<T>(template: PropertyScalar<T>, valueProvider?: ValueProvider<T>): PropertyScalar<T> {
        // TODO copy template and set new value provider if preset else copy value provider too
        throw new Error('Not supported, yet');
    }

    simpleProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, config?: PropertyScalarValueConfig<T> & {
        emptyValueFcn?: EmptyValueFcn<T>;
        initialValue?: T | null;
    }): PropertyScalar<T> {
        return this.propertyScalar(id, new SimpleValueProvider<T>(), config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, undefined, config);
    }

    stringProperty(id: PropertyId, config?: PropertyScalarValueConfig<string>): PropertyScalar<string> {
        config = this.defaultInitValue('', config);
        return this.propertyScalar(id, new SimpleValueProvider<string>(),
            config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn,
            config?.valueConverter ?? C.string.identity,
            undefined,
            config
        );
    }

    numberProperty(id: PropertyId, config?: PropertyScalarValueConfig<number> & {
        zeroIsConsideredAsEmpty?: boolean;
    }): PropertyScalar<number> {
        assertThat(() => !config?.zeroIsConsideredAsEmpty || !config?.emptyValueFcn, () => `${id}: Provide either zeroIsConsideredAsEmpty or emptyValueFcn.`);
        config = this.defaultInitValue(config?.zeroIsConsideredAsEmpty ? 0 : null, config);
        return this.propertyScalar(id, new SimpleValueProvider<number>(),
            config?.emptyValueFcn ?? (config?.zeroIsConsideredAsEmpty ? EmptyValueFcns.defaultEmptyValueFcn : EmptyValueFcns.numberEmptyValueFcn),
            config?.valueConverter ?? C.number.default,
            undefined,
            config
        );
    }

    booleanProperty(id: PropertyId, config?: PropertyScalarValueConfig<boolean>): PropertyScalar<boolean> {
        return this.propertyScalar(id, new SimpleValueProvider<boolean>(),
            config?.emptyValueFcn ?? EmptyValueFcns.booleanEmptyValueFcn,
            config?.valueConverter ?? C.boolean.default,
            undefined,
            config
        );
    }

    dateProperty(id: PropertyId, config?: PropertyScalarValueConfig<Date>): PropertyScalar<Date> {
        return this.propertyScalar(id, new SimpleValueProvider<Date>(),
            config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn,
            config?.valueConverter ?? C.date.iso,
            undefined,
            config
        );
    }

    private defaultInitValue<T>(initialValue: T | null, config?: PropertyScalarValueConfig<T>): PropertyScalarValueConfig<T> {
        if (!config) {
            return {
                initialValue
            };
        }
        if (config.initialValue === undefined) {
            config.initialValue = initialValue;
        }
        return config;
    }

    select = {
        static: <T>(id: PropertyId, choices: Choice<T>[], config?: PropertyScalarValueConfig<T> & { emptyChoice?: Choice<T> }) => {
            const emptyChoice = this.defaultEmptyChoiceDisplayValue !== undefined ? { value: null, displayValue: this.defaultEmptyChoiceDisplayValue } : config?.emptyChoice;
            const provider = new ChoiceValueProvider<T>(choices, emptyChoice);
            const converter = new SelectValueConverter<T>(choices, emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, undefined, config);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : choices[0]?.value);
            prop.setToInitialState();
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        },

        derived: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => <T>(config: PropertyScalarValueConfig<T> & {
            derive: (...dependencies: Dependencies) => Choice<T>[];
            emptyChoice?: Choice<T>;
        }) => {
            const choicesSourceProperty = this.listBuilder.derived.sync(`${id}__choices__`, ...dependencies)<Choice<T>>({
                derive: config.derive
            });
            return this.select.withPropertySource(id, choicesSourceProperty, config);
        },

        asyncDerived: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => <T>(config: PropertyScalarValueConfig<T> & {
            deriveAsync: (...dependencies: Dependencies) => Promise<Choice<T>[]>;
            emptyChoice?: Choice<T>;
            backpressure?: BackpressureConfig;
        }) => {
            const choicesSourceProperty = this.listBuilder.derived.async(`${id}__choices__`, ...dependencies)<Choice<T>>({
                derive: config.deriveAsync
            });
            return this.select.withPropertySource(id, choicesSourceProperty, config);
        },

        withPropertySource: <T, S extends PropertyArrayListReadonly<Choice<T>>>(id: PropertyId, choicesSource: S, config?: PropertyScalarValueConfig<T> & { emptyChoice?: Choice<T> }) => {
            const emptyChoice = this.defaultEmptyChoiceDisplayValue !== undefined ? { value: null, displayValue: this.defaultEmptyChoiceDisplayValue } : config?.emptyChoice;
            const provider = new SelectValueProvider<T, S>(choicesSource, emptyChoice);
            const converter = new SelectValueConverter<T>(() => choicesSource.getElements(), emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [choicesSource], config, [choicesSource]);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : (choicesSource.getElement(0)?.value ?? null));
            prop.setToInitialState();
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        }
    }

    typeahead = {
        async: <T>(id: PropertyId, config: PropertyScalarValueConfig<T> & {
            fetchChoices: (currentText: string) => Promise<Choice<T>[]>;
            minimumTextLength?: number;
        }): PropertyScalarWithChoices<[T | null, string], T> => {
            const inputSourceProperty = this.stringProperty(`${id}__input__`);
            const choicesSourceProperty = this.listBuilder.derived.async(`${id}__choices__`, inputSourceProperty)<Choice<T>>({
                derive: (inputProperty) => {
                    const text = inputProperty.getNonNullValue();
                    if (config.minimumTextLength && text.length < config.minimumTextLength) {
                        return Promise.resolve([]);
                    }
                    return config.fetchChoices(text);
                }
            })
            return this.typeahead.withPropertySource(id, inputSourceProperty, choicesSourceProperty, config);
        },

        withPropertySource: <T, S extends PropertyArrayListReadonly<Choice<T>>>(id: PropertyId, inputSource: PropertyScalar<string>, choicesSource: S, config?: PropertyConfig): PropertyScalarWithChoices<[T | null, string], T> => {
            const provider = new TypeaheadValueProvider<T, S>(inputSource, choicesSource);
            const converter = new TypeaheadValueConverter<T>();
            const emptyValueFcn: EmptyValueFcn<[T | null, string]> = (val) => val?.[0] == null;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [inputSource], config, [inputSource, choicesSource]);
            return upgradeAsPropertyWithChoices(prop, choicesSource);
        }
    }

    objectProperty<T, O>(id: PropertyId, valueConverter: ValueConverter<T>, obj: O, config: PropertyScalarValueConfig<T> & {
        get: (obj: O) => T | null;
        set: (obj: O, val: T | null) => void;
        emptyValueFcn?: EmptyValueFcn<T>;
    }): PropertyScalar<T> {
        return this.propertyScalar(id, new ObjectValueProvider(obj, config.get, config.set), config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, undefined, config);
    }

    derived = {
        sync: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                valueConverter: ValueConverter<T>,
                config: PropertyScalarValueConfig<T> & {
                    derive: Rule<[...dependencies: Dependencies], T | null>;
                    inverse?: (val: T | null, ...dependencies: Dependencies) => void;
                    emptyValueFcn?: EmptyValueFcn<T>;
                },
            ) => {
                const provider = new DerivedValueProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps), config?.inverse);
                return this.propertyScalar(id, provider, config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, dependencies, config) as PropertyScalar<T>;
            }
        },

        async: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                valueConverter: ValueConverter<T>,
                config: PropertyScalarValueConfig<T> & {
                    deriveAsync: Rule<[...dependencies: Dependencies], Promise<T | null>>;
                    inverseAsync?: (val: T | null, ...dependencies: Dependencies) => Promise<void>;
                    backpressure?: BackpressureConfig;
                    emptyValueFcn?: EmptyValueFcn<T>;
                },
            ) => {
                const provider = new DerivedAsyncValueProvider<T, Dependencies>(dependencies, (deps) => config.deriveAsync(...deps), config?.inverseAsync);
                return this.propertyScalar(id, provider, config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, dependencies, config) as PropertyScalar<T>;
            }
        }
    }

    bind<T>(prop: PropertyScalar<T>): PropertyScalarRuleBinding<T> {
        return this.bindPropertyScalar(prop);
    }

}
