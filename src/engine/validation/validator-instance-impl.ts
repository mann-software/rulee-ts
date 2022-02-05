import { AbstractProperty } from "../../properties/abstract-property";
import { CrossValidator } from "../../validators/cross-validator";

/**
 * Validator connected to concrete properties
 */
export interface ValidatorInstance<Properties extends readonly AbstractProperty[]> {
    getValidatedProperties(): Properties;
    validate: CrossValidator<Properties>;
}
