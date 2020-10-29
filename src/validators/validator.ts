import { AbstractProperty } from "../properties/abstract-property";
import { ValidationResult } from "./validation-result";

/**
 * Generalized Validator for synchonous and asynchonous validations for any number of properties
 */
export interface Validator {
    /**
     * properties that are validated
     */
    readonly validatedProperties: readonly AbstractProperty<unknown>[];

    /**
     * additional properties that are needed for validation but not considered as invalid if
     * the validation fails. E.g. to validate if a street name is valid, you need the postal code 
     * as addtional property for validation
     */
    readonly additionalProperties?: readonly AbstractProperty<unknown>[];

    /**
     * validation process
     */
    validate(): ValidationResult | Promise<ValidationResult>;
}
