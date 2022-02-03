import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarValidator } from "../single-property-validator";
import { ValidationMessage } from "../validation-message";

/**
 * creates a validator that checks if the PropertyScalar is required and empty
 * @param valiationMsgProvider variable messages i.e. based on property
 * @returns PropertyScalarValidator
 */
export const notEmptyIfRequiredValidator = <T>(valiationMessageProvider: (property: PropertyScalar<T>) => ValidationMessage) => ((property: PropertyScalar<T>) => {
    if (property.isEmpty() && property.isRequired()) {
        return valiationMessageProvider(property);
    }
}) as PropertyScalarValidator<T>;

/**
 * creates a validator that checks if the display value matches the given pattern
 * @param pattern regex
 * @param msg message to issue
 * @returns PropertyScalarValidator
 */
export const patternValidator = <T>(pattern: RegExp, msg: ValidationMessage) => ((property: PropertyScalar<T>) => {
    if (pattern.test(property.getDisplayValue())) {
        return msg;
    }
}) as PropertyScalarValidator<T>;
