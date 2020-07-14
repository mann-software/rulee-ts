import { PropertyTemplate } from "../../properties/factory/property-template";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyId } from "../../properties/property-id";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListProvider } from "../../provider/list-provider/list-provider";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { SimpleListProvider } from "../../provider/list-provider/simple-list-provider";

export enum SelectionMode {
    MultiSelect, SingleSelect
}

export class ListOfPropertiesBuilder {

    constructor(
        private propertyList: <T extends AbstractProperty<D>, D>(id: string, listProvider: ListProvider<T, D>, selectedIndices: number[], isMultiSelect: boolean) => ListOfPropertiesImpl<T, D>
    ) {}

    createList<T extends AbstractProperty<D>, D>(id: PropertyId, itemTemplate: PropertyTemplate<T, D>, selectionMode?: SelectionMode): ListOfProperties<T, D> {
        const selectedIndices: number[] = [];
        const listProvider = new SimpleListProvider(id, itemTemplate, (idx) => selectedIndices.includes(idx));
        return this.propertyList(id, listProvider, selectedIndices, selectionMode === SelectionMode.MultiSelect);
    }

}
