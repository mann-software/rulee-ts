import { AbstractProperty } from "../properties/abstract-property";

export type Rule<Args extends readonly AbstractProperty<unknown>[], R> = (...args: Args) => R;
