import { AbstractProperty } from "../properties/abstract-property";
import { PropertyId } from "../properties/property-id";
import { ValidationMessage } from "./validation-message";
import { PropertyScalar } from "../properties/property-scalar";

export interface ValidationResult {
    /**
     * Return the Valilidation messages for the given poperty. 
     * Return null or empty array if it is valid and there is no message to display.
     * 
     * It is ensured by the rule engine, that the propertyId is one of
     * the properties returned by getValidatedProperties(). 
     * Thus, you only need to handle these cases.
     * E.g. just return the ValidationMessage(s) if there is only one property 
     * or the message(s) are issued for all properties that are validated
     * 
     * @param propertyId id of one property returned by getValidatedProperties()
     */
    getMessages(propertyId: PropertyId): ValidationMessage[] | null;
}

export const ValidationPassed: ValidationResult = {
    getMessages: () => null
};

/**
 * Most common Validator with its own speialized validator interface.
 * 
 * Synchronously validates a single PropertyScalar
 */
export interface ScalarValidator<T> {
    /**
     * Return null if the property is valid with no message to issue.
     * Designed to return one message. You can associate more ScalarValidator's
     * to one PropertyScalar if there are different validations that lead to more
     * than one message at once
     * 
     * @param property property to validate
     */
    validate(property: PropertyScalar<T>): ValidationMessage | null;
}

/**
 * Generalized Validator
 */
export interface Validator {
    /**
     * get the properties that are validated
     */
    getValidatedProperties(): AbstractProperty<any>[];
    /**
     * get additional properties that are needed for validation but not considered as invalid if
     * the validation fails. E.g. to validate if a street name is valid, you need the postal code 
     * as addtional property for validation
     */
    getAdditionalProperties(): AbstractProperty<any>[];
    /**
     * start validation process
     */
    validate(): Promise<ValidationResult>;
    /**
     * gets the last validation result
     */
    getLastValidationResult(): ValidationResult;
    /**
     * indicates that the validation is asynchronous.
     * if false, the getLastValidationResult() is up to date immediately after validate()
     */
    isAsynchronous(): boolean;
}
