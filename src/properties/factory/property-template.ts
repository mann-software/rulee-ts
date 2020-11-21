import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { AbstractDataProperty } from "../abstract-data-property";
import { ListIndex } from "./list-index";

/**
 * factory method to create a new property, if called in context of a list, the index argument is available
 */
export type PropertyTemplate<T extends AbstractDataProperty<D>, D> = (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<T>) => T;
