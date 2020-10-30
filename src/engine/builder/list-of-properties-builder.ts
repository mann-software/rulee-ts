import { PropertyTemplate } from "../../properties/factory/property-template";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyId } from "../../properties/property-id";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListProvider } from "../../provider/list-provider/list-provider";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { SimpleListProvider } from "../../provider/list-provider/simple-list-provider";
import { ListIndex } from "../../properties/factory/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { Validator } from "../../validators/validator";
import { ValidatorInstance } from "../validation/validator-instance-impl";

export enum SelectionMode {
    MultiSelect, SingleSelect
}

export class ListOfPropertiesBuilder {

    constructor(
        private readonly propertyList: <T extends AbstractProperty<D>, D>(id: string, listProvider: ListProvider<T, D>, selectedIndices: number[], isMultiSelect: boolean) => ListOfPropertiesImpl<T, D>
    ) {}

    create<T extends AbstractProperty<D>, D>(id: PropertyId, itemTemplate: PropertyTemplate<T, D>, selectionMode?: SelectionMode): ListOfProperties<T, D> {
        const selectedIndices: number[] = [];
        const listProvider = new SimpleListProvider(id, itemTemplate, (idx) => selectedIndices.includes(idx));
        return this.propertyList(id, listProvider, selectedIndices, selectionMode === SelectionMode.MultiSelect);
    }

    template<T extends AbstractProperty<D>, D>(id: string, factory: (listBuilder: ListOfPropertiesBuilder, id: PropertyId, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>, (D | null)[]>) => ListOfProperties<T, D>): PropertyTemplate<ListOfProperties<T, D>, (D | null)[]> {
        return (prefix: string, index?: ListIndex, siblingAccess?: SiblingAccess<ListOfProperties<T, D>, (D | null)[]>) => factory(this, `${prefix}_${id}`, index, siblingAccess);
    }

    bindValidator<T extends AbstractProperty<D>, D>(list: ListOfProperties<T, D>, validator: Validator<T[]>) {
        const instance: ValidatorInstance<AbstractProperty<D>[]> = {
            getValidatedProperties: () => list.list,
            validate: validator as Validator<AbstractProperty<D>[]>
        };
        (list as ListOfPropertiesImpl<T, D>).addValidator(instance);
    }
}
