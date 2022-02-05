import { ListOfPropertiesTemplate, PropertyTemplate } from "../../properties/factory/property-template";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyId } from "../../properties/property-id";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { ListIndex } from "../../properties/lists/index/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { Rule } from "../../rules/rule";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { PropertyConfig } from "./builder-options";
import { PropertyArrayListAsyncImpl, PropertyArrayListImpl, PropertyArrayListSyncImpl } from "../../properties/property-array-list-impl";
import { AsyncListProvider, ListProvider } from "../../provider/list-provider/list-provider";
import { PropertyArrayList, PropertyArrayListCrud, PropertyArrayListCrudAsync, PropertyArrayListReadonly, PropertyArrayListReadonlyAsync } from "../../properties/property-array-list";
import { DerivedListProvider } from "../../provider/list-provider/derived-list-provider";
import { DerivedAsyncListProvider } from "../../provider/list-provider/derived-async-list-provider";
import { CrudAsyncListProvider } from "../../provider/list-provider/crud-async-list-provider";
import { CrudListProvider } from "../../provider/list-provider/crud-list-provider";
import { ListOfPropertiesRuleBuilder } from "./list-of-properties-rule-builder";
import { PropertyArrayListRuleBuilder } from "./property-array-list-rule-builder";
import { ArrayListRulesDefinition } from "../../rules/array-list-rules-definition";
import { ListOfPropertiesRulesDefinition } from "../../rules/list-of-properties-rules-definition";

export enum SelectionMode {
    MultiSelect, SingleSelect
}

export interface PropertyListConfig extends PropertyConfig {
    maxLength?: number;
}

export interface ComplexPropertyListConfig extends PropertyListConfig {
    selectionMode?: SelectionMode;
}

export class ListBuilder {

    constructor(
        private readonly listOfProperties: <T extends AbstractDataProperty<D>, D>(
            id: string,
            itemTemplate: PropertyTemplate<T, D>,
            propertyConfig?: ComplexPropertyListConfig,
        ) => ListOfPropertiesImpl<T, D>,
        private readonly propertyList: <T>(
            id: PropertyId,
            provider: ListProvider<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyListConfig,
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyArrayListSyncImpl<T>,
        private readonly asyncPropertyList: <T>(
            id: PropertyId,
            provider: AsyncListProvider<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyListConfig & { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyArrayListAsyncImpl<T>,
    ) {}

    create<T extends AbstractDataProperty<D>, D>(
        id: PropertyId,
        itemTemplate: PropertyTemplate<T, D>,
        config?: ComplexPropertyListConfig,
        ...definitions: ListOfPropertiesRulesDefinition<T, D>[]
    ): ListOfProperties<T, D> {
        const list = this.listOfProperties(id, itemTemplate, config);
        return this.bindRulesAndApplyConfigListOfProperties(list, config, ...definitions);
    }

    template<T extends AbstractDataProperty<D>, D>(
        id: string,
        factory: (listBuilder: ListBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => ListOfProperties<T, D>,
        config?: ComplexPropertyListConfig,
        ...definitions: ListOfPropertiesRulesDefinition<T, D>[]
    ): ListOfPropertiesTemplate<T, D> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => {
            const list = factory(this, `${prefix}_${id}`, index, siblingAccess);
            return this.bindRulesAndApplyConfigListOfProperties(list as (ListOfPropertiesImpl<T, D>), config, ...definitions);
        }
    }

    derived = {
        sync: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyListConfig & {
                    derive: Rule<[...dependencies: Dependencies], T[]>;
                },
                ...definitions: ArrayListRulesDefinition<T>[]
            ) => {
                const provider = new DerivedListProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps));
                const list = this.propertyList(id, provider, dependencies, config);
                return this.bindRulesAndApplyConfigArrayList(list, config, ...definitions) as PropertyArrayListReadonly<T>;
            }
        },
        async: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyListConfig & {
                    derive: Rule<[...dependencies: Dependencies], Promise<T[]>>;
                },
                ...definitions: ArrayListRulesDefinition<T>[]
            ) => {
                const provider = new DerivedAsyncListProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps));
                const list = this.asyncPropertyList(id, provider, dependencies, config);
                return this.bindRulesAndApplyConfigArrayList(list, config, ...definitions) as PropertyArrayListReadonlyAsync<T>;
            }
        }
    }

    crud = {
        sync: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config?: PropertyListConfig & {
                    resourceProvider?: Rule<[...dependencies: Dependencies], T[]>;
                },
                ...definitions: ArrayListRulesDefinition<T>[]
            ) => {
                if (!config) {
                    config = {};
                }
                if (!config.resourceProvider) {
                    config.resourceProvider = () => [];
                }
                const provider = new CrudListProvider<T, Dependencies>(dependencies, (deps) => config!.resourceProvider!(...deps));
                const list = this.propertyList(id, provider, dependencies, config);
                return this.bindRulesAndApplyConfigArrayList(list, config, ...definitions) as PropertyArrayListCrud<T>;
            }
        },
        async: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyListConfig & {
                    getElements: Rule<[...dependencies: Dependencies], Promise<T[]>>;
                    addElement: (propertyData: T, index?: number) => Promise<void>;
                    updateElement: (propertyData: T, index: number) => Promise<void>;
                    removeElement: (index: number) => Promise<void>;
                },
                ...definitions: ArrayListRulesDefinition<T>[]
            ) => {
                const provider = new CrudAsyncListProvider<T, Dependencies>(
                    dependencies,
                    config.addElement,
                    (deps) => config.getElements(...deps),
                    config.updateElement,
                    config.removeElement
                );
                const list = this.asyncPropertyList(id, provider, dependencies, config);
                return this.bindRulesAndApplyConfigArrayList(list, config, ...definitions) as PropertyArrayListCrudAsync<T>;
            }
        }
    }

    // ------------------

    bindListOfProperties<T extends AbstractDataProperty<D>, D>(list: ListOfProperties<T, D>, ...definitions: ListOfPropertiesRulesDefinition<T, D>[]): void {
        const builder = new ListOfPropertiesRuleBuilder<T, D>(list);
        definitions.forEach(def => def.buildRules(builder));
    }

    private bindRulesAndApplyConfigListOfProperties<T extends AbstractDataProperty<D>, D>(prop: ListOfPropertiesImpl<T, D>, config?: ComplexPropertyListConfig, ...rulesDefintions: ListOfPropertiesRulesDefinition<T, D>[]): ListOfProperties<T, D> {
        this.bindListOfProperties(prop, ...rulesDefintions);
        if (config) {
            if (config.label !== undefined) {
                prop.defineLabel(config.label);
            }
        }
        prop.setToInitialState();
        return prop;
    }

    bindPropertyArrayList<D>(list: PropertyArrayList<D>, ...definitions: ArrayListRulesDefinition<D>[]): void {
        const builder = new PropertyArrayListRuleBuilder(list);
        definitions.forEach(def => def.buildRules(builder));
    }

    private bindRulesAndApplyConfigArrayList<T, List extends PropertyArrayListImpl<T>>(prop: List, config?: PropertyListConfig, ...rulesDefintions: ArrayListRulesDefinition<T>[]): List {
        this.bindPropertyArrayList(prop, ...rulesDefintions);
        if (config) {
            if (config.label !== undefined) {
                prop.defineLabel(config.label);
            }
        }
        prop.setToInitialState();
        return prop;
    }

}
