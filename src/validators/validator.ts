import { AbstractProperty } from "../properties/abstract-property";
import { ValidationResult } from "./validation-result";

/**
 * Generalized Validator for synchonous and asynchonous validations for any number of properties
 */
export type Validator<Properties extends readonly AbstractProperty<unknown>[]> = (...args: Properties) => ValidationResult | Promise<ValidationResult>;
