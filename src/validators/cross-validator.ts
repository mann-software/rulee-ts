import { AbstractProperty } from "../properties/abstract-property";
import { CrossValidationResult } from "./cross-validation-result";

/**
 * Cross Validator for synchonous and asynchonous validations for any number of properties
 */
export type CrossValidator<Properties extends readonly AbstractProperty[]> = (...args: Properties) => CrossValidationResult | Promise<CrossValidationResult>;
