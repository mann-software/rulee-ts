import { AbstractProperty } from "../properties/abstract-property";

export type Rule<Dependencies extends readonly AbstractProperty<unknown>[], R> = (...args: Dependencies) => R;
