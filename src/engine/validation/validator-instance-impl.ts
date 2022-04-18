import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { AbstractProperty } from "../../properties/abstract-property";
import { AsyncPropertyValidator } from "../../validators/async-property-validator";
import { CrossValidator } from "../../validators/cross-validator";
import { PropertyValidator } from "../../validators/property-validator";

/**
 * Validator connected to concrete properties
 */
export interface ValidatorInstance<Validator, Properties extends readonly AbstractProperty[]> {
    validationArguments: Properties;
    validate: Validator;
}

export type CrossValidatorInstance<Properties extends readonly AbstractProperty[]> = ValidatorInstance<CrossValidator<Properties>, Properties>;

export type PropertyValidatorInstance<T extends AbstractDataProperty<unknown>, Properties extends readonly AbstractProperty[]> = ValidatorInstance<PropertyValidator<T, Properties>, Properties>;

export type AsyncPropertyValidatorInstance<T extends AbstractDataProperty<unknown>, Properties extends readonly AbstractProperty[]> = ValidatorInstance<AsyncPropertyValidator<T, Properties>, Properties>;
