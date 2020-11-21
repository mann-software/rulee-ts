import { AbstractProperty } from "../properties/abstract-property";

export type Rule<Dependencies extends readonly AbstractProperty[], R> = (...args: Dependencies) => R;
