import { AbstractProperty } from "../abstract-property";
import { ListIndex } from "./list-index";

/**
 * factory method to create a new property, if called in context of a list, the index argument is available
 */
export type PropertyTemplate<T extends AbstractProperty<D>, D> = (id: string, index?: ListIndex) => T;
