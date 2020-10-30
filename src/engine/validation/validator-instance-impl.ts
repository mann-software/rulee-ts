import { AbstractProperty } from "../../properties/abstract-property";
import { Validator } from "../../validators/validator";

/**
 * Validator connected to concrete properties
 */
export interface ValidatorInstance<Properties extends readonly AbstractProperty<unknown>[]> {
    readonly validatedProperties: Properties;
    validate: Validator<Properties>;
}
