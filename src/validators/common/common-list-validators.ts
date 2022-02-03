import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesValidator } from "../single-property-validator";
import { ValidationMessage } from "../validation-message";

/**
 * creates a validator that checks if the list does not exceed the given length
 * @param maxLength number
 * @param msg message to issue
 * @returns ListOfPropertiesValidator
 */
 export const lengthValidator = <T extends AbstractDataProperty<D>, D>(maxLength: number, msg: ValidationMessage) => ((property: ListOfProperties<T, D>) => {
    if (property.length > maxLength) {
        return msg;
    }
}) as ListOfPropertiesValidator<T, D>;
