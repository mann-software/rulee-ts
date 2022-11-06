import { PropertyScalar } from "../../properties/property-scalar";
import { ValidationMessage } from "../validation-message";
import { lengthValidator } from "./common-list-validators";
import { notEmptyIfRequiredValidator, patternValidator } from "./common-scalar-validators";

export const V = {
    scalar: {
        /**
         * creates a validator that checks if the PropertyScalar is required and empty
         * @param msg message to issue
         * @returns PropertyScalarValidator
         */
        notEmpty: <T>(msg: ValidationMessage) => notEmptyIfRequiredValidator<T>(() => msg),
        /**
         * creates a validator that checks if the PropertyScalar is required and empty
         * @param valiationMsgProvider variable messages i.e. based on property
         * @returns PropertyScalarValidator
         */
        notEmptyMsgProvider: <T>(valiationMsgProvider: (property: PropertyScalar<T>) => ValidationMessage) => notEmptyIfRequiredValidator<T>(valiationMsgProvider),
        /**
         * creates a validator that checks if the display value matches the given pattern
         * @param pattern regex
         * @param msg message to issue
         * @returns PropertyScalarValidator
         */
        patternValidator,
    },
    list: {
        /**
         * creates a validator that checks if the list does not exceed the given length
         * @param maxLength number
         * @param msg message to issue
         * @returns ListOfPropertiesValidator
         */
        lengthValidator,
    },
} as const;
