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
import { PropertyScalarRuleBuilder } from "./property-scalar-rule-builder";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { EmptyValueFcn, EmptyValueFcns } from "../../provider/empty-value-fcn";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
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
import { ScalarRulesDefinition } from "../../rules/scalar-rules-definition";

export interface PropertyScalarConfig extends PropertyConfig {
    placeholder?: string;
    labelAndPlaceholder?: string;
}

export interface PropertyScalarValueConfig<T> extends PropertyScalarConfig {
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
            propertyConfig?: { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyScalarImpl<T>,
        private readonly bindPropertyScalar: <T>(prop: PropertyScalar<T>) => PropertyScalarRuleBuilder<T>,
        private readonly defaultEmptyChoiceDisplayValue: string | undefined,
        private readonly listBuilder: ListBuilder,
    ) { }

    template<D>(id: string, factory: (scalarBuilder: PropertyScalarBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<PropertyScalar<D>>) => PropertyScalar<D>): PropertyTemplate<PropertyScalar<D>, D> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<PropertyScalar<D>>) => factory(this, `${prefix}_${id}`, index, siblingAccess);
    }

    simpleProperty<T>(id: PropertyId, valueConverter: ValueConverter<T>, config?: PropertyScalarValueConfig<T>, ...rulesdefinitions: ScalarRulesDefinition<T>[]): PropertyScalar<T> {
        const scalar = this.propertyScalar(id, new SimpleValueProvider<T>(), config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter);
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
    }

    stringProperty(id: PropertyId, config?: PropertyScalarValueConfig<string>, ...rulesdefinitions: ScalarRulesDefinition<string>[]): PropertyScalar<string> {
        config = this.defaultInitValue('', config);
        const scalar = this.propertyScalar(id, new SimpleValueProvider<string>(),
            config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn,
            config?.valueConverter ?? C.string.identity,
        );
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
    }

    numberProperty(id: PropertyId, config?: PropertyScalarValueConfig<number> & { zeroIsConsideredAsEmpty?: boolean }, ...rulesdefinitions: ScalarRulesDefinition<number>[]): PropertyScalar<number> {
        assertThat(() => !config?.zeroIsConsideredAsEmpty || !config?.emptyValueFcn, () => `${id}: Provide either zeroIsConsideredAsEmpty or emptyValueFcn.`);
        config = this.defaultInitValue(config?.zeroIsConsideredAsEmpty ? 0 : null, config);
        const scalar = this.propertyScalar(id, new SimpleValueProvider<number>(),
            config?.emptyValueFcn ?? (config?.zeroIsConsideredAsEmpty ? EmptyValueFcns.defaultEmptyValueFcn : EmptyValueFcns.numberEmptyValueFcn),
            config?.valueConverter ?? C.number.default,
        );
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
    }

    booleanProperty(id: PropertyId, config?: PropertyScalarValueConfig<boolean>, ...rulesdefinitions: ScalarRulesDefinition<boolean>[]): PropertyScalar<boolean> {
        const scalar = this.propertyScalar(id, new SimpleValueProvider<boolean>(),
            config?.emptyValueFcn ?? EmptyValueFcns.booleanEmptyValueFcn,
            config?.valueConverter ?? C.boolean.default,
        );
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
    }

    dateProperty(id: PropertyId, config?: PropertyScalarValueConfig<Date>, ...rulesdefinitions: ScalarRulesDefinition<Date>[]): PropertyScalar<Date> {
        const scalar = this.propertyScalar(id, new SimpleValueProvider<Date>(),
            config?.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn,
            config?.valueConverter ?? C.date.iso,
        );
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
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
        static: <T>(id: PropertyId, choices: Choice<T>[], config?: PropertyScalarValueConfig<T> & { emptyChoice?: Choice<T> }, ...rulesdefinitions: ScalarRulesDefinition<T>[]) => {
            const emptyChoice = this.defaultEmptyChoiceDisplayValue !== undefined ? { value: null, displayValue: this.defaultEmptyChoiceDisplayValue } : config?.emptyChoice;
            const provider = new ChoiceValueProvider<T>(choices, emptyChoice);
            const converter = new SelectValueConverter<T>(choices, emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : choices[0]?.value);
            this.bindRulesAndApplyConfig(prop, config, ...rulesdefinitions);
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        },

        derived: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => <T>(config: PropertyScalarValueConfig<T> & {
            derive: (...dependencies: Dependencies) => Choice<T>[];
            emptyChoice?: Choice<T>;
        }, ...rulesdefinitions: ScalarRulesDefinition<T>[]) => {
            const choicesSourceProperty = this.listBuilder.derived.sync(`${id}__choices__`, ...dependencies)<Choice<T>>({
                derive: config.derive
            });
            return this.select.withPropertySource(id, choicesSourceProperty, config, ...rulesdefinitions);
        },

        asyncDerived: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => <T>(config: PropertyScalarValueConfig<T> & {
            deriveAsync: (...dependencies: Dependencies) => Promise<Choice<T>[]>;
            emptyChoice?: Choice<T>;
            backpressure?: BackpressureConfig;
        }, ...rulesdefinitions: ScalarRulesDefinition<T>[]) => {
            const choicesSourceProperty = this.listBuilder.derived.async(`${id}__choices__`, ...dependencies)<Choice<T>>({
                derive: config.deriveAsync
            });
            return this.select.withPropertySource(id, choicesSourceProperty, config, ...rulesdefinitions);
        },

        withPropertySource: <T, S extends PropertyArrayListReadonly<Choice<T>>>(id: PropertyId, choicesSource: S, config?: PropertyScalarValueConfig<T> & { 
            emptyChoice?: Choice<T>;
            backpressure?: BackpressureConfig;
        }, ...rulesdefinitions: ScalarRulesDefinition<T>[]) => {
            const emptyChoice = this.defaultEmptyChoiceDisplayValue !== undefined ? { value: null, displayValue: this.defaultEmptyChoiceDisplayValue } : config?.emptyChoice;
            const provider = new SelectValueProvider<T, S>(choicesSource, emptyChoice);
            const converter = new SelectValueConverter<T>(() => choicesSource.getElements(), emptyChoice);
            const emptyValueFcn = emptyChoice ? EmptyValueFcns.choiceEmptyValueFcn(emptyChoice) : EmptyValueFcns.defaultEmptyValueFcn;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [choicesSource], config, [choicesSource]);
            prop.defineInitialValue(emptyChoice?.value !== undefined ? emptyChoice?.value : (choicesSource.getElement(0)?.value ?? null));
            this.bindRulesAndApplyConfig(prop, config, ...rulesdefinitions);
            return upgradeAsPropertyWithChoices(prop, () => provider.getChoices());
        }
    }

    typeahead = {
        async: <T>(id: PropertyId, config: PropertyScalarValueConfig<T> & {
            fetchChoices: (currentText: string) => Promise<Choice<T>[]>;
            minimumTextLength?: number;
        }, ...rulesdefinitions: ScalarRulesDefinition<[T | null, string]>[]): PropertyScalarWithChoices<[T | null, string], T> => {
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
            return this.typeahead.withPropertySource(id, inputSourceProperty, choicesSourceProperty, config, ...rulesdefinitions);
        },

        withPropertySource: <T, S extends PropertyArrayListReadonly<Choice<T>>>(id: PropertyId, inputSource: PropertyScalar<string>, choicesSource: S, config?: PropertyScalarConfig, ...rulesdefinitions: ScalarRulesDefinition<[T | null, string]>[]): PropertyScalarWithChoices<[T | null, string], T> => {
            const provider = new TypeaheadValueProvider<T, S>(inputSource, choicesSource);
            const converter = new TypeaheadValueConverter<T>();
            const emptyValueFcn: EmptyValueFcn<[T | null, string]> = (val) => val?.[0] == null;
            const prop = this.propertyScalar(id, provider, emptyValueFcn, converter, [inputSource], undefined, [inputSource, choicesSource]);
            this.bindRulesAndApplyConfig(prop, config, ...rulesdefinitions);
            return upgradeAsPropertyWithChoices(prop, choicesSource);
        }
    }

    objectProperty<T, O>(id: PropertyId, valueConverter: ValueConverter<T>, obj: O, config: PropertyScalarValueConfig<T> & {
        get: (obj: O) => T | null;
        set: (obj: O, val: T | null) => void;
        emptyValueFcn?: EmptyValueFcn<T>;
    }, ...rulesdefinitions: ScalarRulesDefinition<T>[]): PropertyScalar<T> {
        const scalar = this.propertyScalar(id, new ObjectValueProvider(obj, config.get, config.set), config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter);
        return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
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
                ...rulesdefinitions: ScalarRulesDefinition<T>[]
            ) => {
                const provider = new DerivedValueProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps), config?.inverse);
                const scalar = this.propertyScalar(id, provider, config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, dependencies);
                return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
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
                ...rulesdefinitions: ScalarRulesDefinition<T>[]
            ) => {
                const provider = new DerivedAsyncValueProvider<T, Dependencies>(dependencies, (deps) => config.deriveAsync(...deps), config?.inverseAsync);
                const scalar = this.propertyScalar(id, provider, config.emptyValueFcn ?? EmptyValueFcns.defaultEmptyValueFcn, valueConverter, dependencies, config);
                return this.bindRulesAndApplyConfig(scalar, config, ...rulesdefinitions);
            }
        }
    }

    bind<T>(prop: PropertyScalar<T>, ...rulesDefintion: ScalarRulesDefinition<T>[]): void {
        const ruleBuilder = this.bindPropertyScalar(prop);
        rulesDefintion.forEach(def => def.apply(ruleBuilder));
    }

    private bindRulesAndApplyConfig<T>(prop: PropertyScalarImpl<T>, config?: PropertyScalarValueConfig<T>, ...rulesDefintion: ScalarRulesDefinition<T>[]): PropertyScalar<T> {
        this.bind(prop, ...rulesDefintion);
        if (config) {
            if (config.initialValue !== undefined) {
                prop.defineInitialValue(config.initialValue);
            }
            if (config.labelAndPlaceholder !== undefined) {
                prop.defineLabel(config.labelAndPlaceholder);
                prop.definePlaceholder(config.labelAndPlaceholder);
            }
            if (config.label !== undefined) {
                prop.defineLabel(config.label);
            }
            if (config.placeholder !== undefined) {
                prop.definePlaceholder(config.placeholder);
            }
        }
        prop.setToInitialState();
        return prop;
    }

}
