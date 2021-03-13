import { ListOfPropertiesTemplate, PropertyTemplate } from "../../properties/factory/property-template";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyId } from "../../properties/property-id";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { ListIndex } from "../../properties/lists/index/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { Validator } from "../../validators/validator";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { Rule } from "../../rules/rule";
import { EmptyValueFcns } from "../../provider/empty-value-fcn";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { PropertyConfig } from "./builder-options";
import { PropertyArrayListImpl } from "../../properties/property-array-list-impl";
import { ListProvider } from "../../provider/list-provider/list-provider";
import { ValueConverter } from "../../value-converter/value-converter";
import { PropertyArrayList, PropertyArrayListReadonly, PropertyArrayListReadonlyAsync } from "../../properties/property-array-list";
import { ReadonlyListProvider } from "../../provider/list-provider/readonly-list-provider";

export enum SelectionMode {
    MultiSelect, SingleSelect
}

export class ListOfPropertiesBuilder {

    constructor(
        private readonly listOfProperties: <T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, isMultiSelect: boolean) => ListOfPropertiesImpl<T, D>,
        private readonly propertyList: <T>(
            id: PropertyId,
            provider: ListProvider<T>,
            dependencies?: readonly AbstractProperty[],
            propertyConfig?: PropertyConfig & { backpressure?: BackpressureConfig },
            ownedProperties?: readonly AbstractProperty[],
        ) => PropertyArrayListImpl<T>,
    ) {}

    create<T extends AbstractDataProperty<D>, D>(id: PropertyId, itemTemplate: PropertyTemplate<T, D>, selectionMode?: SelectionMode): ListOfProperties<T, D> {
        return this.listOfProperties(id, itemTemplate, selectionMode === SelectionMode.MultiSelect);
    }

    template<T extends AbstractDataProperty<D>, D>(id: string, factory: (listBuilder: ListOfPropertiesBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => ListOfProperties<T, D>): ListOfPropertiesTemplate<T, D> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>>) => factory(this, `${prefix}_${id}`, index, siblingAccess);
    }

    derived = {
        sync: <T, Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return (
                config: PropertyConfig & {
                    derive: Rule<[...dependencies: Dependencies], T[]>;
                },
            ) => {
                const provider = new ReadonlyListProvider<T>(config.derive);
                return this.propertyList(id, provider, dependencies, config) as PropertyArrayListReadonly<T>;
            }
        },
        async: <T, Dependencies extends readonly AbstractProperty[]>(id: PropertyId, ...dependencies: Dependencies) => {
            return (
                config: PropertyConfig & {
                    derive: Rule<[...dependencies: Dependencies], Promise<T[]>>;
                },
            ) => {
                const provider = new ReadonlyListProvider<T>(() => []); // TODO
                return this.propertyList(id, provider, dependencies, config) as PropertyArrayListReadonlyAsync<T>;
            }
        }
    }

    bindValidator<T extends AbstractDataProperty<D>, D>(list: ListOfProperties<T, D>, validator: Validator<T[]>) {
        const instance: ValidatorInstance<AbstractProperty[]> = {
            getValidatedProperties: () => list.list,
            validate: validator as Validator<AbstractProperty[]>
        };
        (list as ListOfPropertiesImpl<T, D>).addValidator(instance);
    }
}
