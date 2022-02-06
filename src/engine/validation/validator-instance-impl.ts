import { AbstractProperty } from "../../properties/abstract-property";
import { CrossValidator } from "../../validators/cross-validator";

/**
 * Validator connected to concrete properties
 */
export interface ValidatorInstance<Properties extends readonly AbstractProperty[]> {
    validationArguments: Properties;
    validate: CrossValidator<Properties>;
}
