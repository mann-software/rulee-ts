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
import { PropertyArrayListAsyncImpl, PropertyArrayListSyncImpl } from "../../properties/property-array-list-impl";
import { AsyncListProvider, ListProvider } from "../../provider/list-provider/list-provider";
import { PropertyArrayList, PropertyArrayListCrud, PropertyArrayListCrudAsync, PropertyArrayListReadonly, PropertyArrayListReadonlyAsync } from "../../properties/property-array-list";
import { DerivedListProvider } from "../../provider/list-provider/derived-list-provider";
import { DerivedAsyncListProvider } from "../../provider/list-provider/derived-async-list-provider";
import { CrudAsyncListProvider } from "../../provider/list-provider/crud-async-list-provider";
import { CrudListProvider } from "../../provider/list-provider/crud-list-provider";
import { ListOfPropertiesRuleBinding } from "./list-of-properties-rule-bindings";
import { PropertyArrayListRuleBinding } from "./property-array-list-rule-binding";

export enum SelectionMode {
    MultiSelect, SingleSelect
}

export class ListBuilder {

    constructor(
        private readonly listOfProperties: <T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, isMultiSelect: boolean) => ListOfPropertiesImpl<T, D>,
        private readonly propertyList: <T>(
            id: PropertyId,
            provider: ListProvider<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyConfig & { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyArrayListSyncImpl<T>,
        private readonly asyncPropertyList: <T>(
            id: PropertyId,
            provider: AsyncListProvider<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyConfig & { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyArrayListAsyncImpl<T>,
    ) {}

    create<T extends AbstractDataProperty<D>, D>(id: PropertyId, itemTemplate: PropertyTemplate<T, D>, selectionMode?: SelectionMode): ListOfProperties<T, D> {
        return this.listOfProperties(id, itemTemplate, selectionMode === SelectionMode.MultiSelect);
    }

    template<T extends AbstractDataProperty<D>, D>(id: string, factory: (listBuilder: ListBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => ListOfProperties<T, D>): ListOfPropertiesTemplate<T, D> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => factory(this, `${prefix}_${id}`, index, siblingAccess);
    }

    derived = {
        sync: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyConfig & {
                    derive: Rule<[...dependencies: Dependencies], T[]>;
                },
            ) => {
                const provider = new DerivedListProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps));
                return this.propertyList(id, provider, dependencies, config) as PropertyArrayListReadonly<T>;
            }
        },
        async: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyConfig & {
                    derive: Rule<[...dependencies: Dependencies], Promise<T[]>>;
                },
            ) => {
                const provider = new DerivedAsyncListProvider<T, Dependencies>(dependencies, (deps) => config.derive(...deps));
                return this.asyncPropertyList(id, provider, dependencies, config) as PropertyArrayListReadonlyAsync<T>;
            }
        }
    }

    crud = {
        sync: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config?: PropertyConfig & {
                    resourceProvider?: Rule<[...dependencies: Dependencies], T[]>;
                },
            ) => {
                if (!config) {
                    config = {};
                }
                if (!config.resourceProvider) {
                    config.resourceProvider = () => [];
                }
                const provider = new CrudListProvider<T, Dependencies>(dependencies, (deps) => config!.resourceProvider!(...deps));
                return this.propertyList(id, provider, dependencies, config) as PropertyArrayListCrud<T>;
            }
        },
        async: <Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return <T>(
                config: PropertyConfig & {
                    getElements: Rule<[...dependencies: Dependencies], Promise<T[]>>;
                    addElement: (propertyData: T, index?: number) => Promise<void>;
                    updateElement: (propertyData: T, index: number) => Promise<void>;
                    removeElement: (index: number) => Promise<void>;
                },
            ) => {
                const provider = new CrudAsyncListProvider<T, Dependencies>(
                    dependencies,
                    config.addElement,
                    (deps) => config.getElements(...deps),
                    config.updateElement,
                    config.removeElement
                );
                return this.asyncPropertyList(id, provider, dependencies, config) as PropertyArrayListCrudAsync<T>;
            }
        }
    }

    // ------------------

    bindListOfProperties<T extends AbstractDataProperty<D>, D>(list: ListOfProperties<T, D>): ListOfPropertiesRuleBinding<T, D> {
        return new ListOfPropertiesRuleBinding<T, D>(list)
    }

    bindPropertyArrayList<D>(list: PropertyArrayList<D>): PropertyArrayListRuleBinding<D> {
        return new PropertyArrayListRuleBinding(list);
    }

}
