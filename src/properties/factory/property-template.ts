import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { AbstractDataProperty } from "../abstract-data-property";
import { PropertyGroup, GroupOfProperties, PropertyGroupData } from "../group-of-properties";
import { ListOfProperties } from "../list-of-properties";
import { ListIndex } from "./list-index";

/**
 * factory method to create a new property, if called in context of a list, the index argument is available
 */
export type PropertyTemplate<T extends AbstractDataProperty<D>, D> = (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<T>) => T;

export type GroupOfPropertiesTemplate<T extends PropertyGroup> = PropertyTemplate<GroupOfProperties<T>, PropertyGroupData<T>>;
export type ListOfPropertiesTemplate<T extends AbstractDataProperty<D>, D> = PropertyTemplate<ListOfProperties<T, D>, (D | null)[]>;
