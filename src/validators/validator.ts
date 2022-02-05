import { AbstractProperty } from "../properties/abstract-property";
import { ValidatorValidationResult } from "./validator-validation-result";

/**
 * Generalized Validator for synchonous and asynchonous validations for any number of properties
 */
export type Validator<Properties extends readonly AbstractProperty[]> = (...args: Properties) => ValidatorValidationResult | Promise<ValidatorValidationResult>;
