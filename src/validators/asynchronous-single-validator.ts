import { Validator, ValidationResult, ValidationPassed } from "./validator";
import { AbstractProperty } from "../properties/abstract-property";
import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";

export abstract class AsynchronousSingleValidator<T, R> implements Validator {

    private lastValue?: T;
    private lastValidationResult = ValidationPassed;
    private propertyList: PropertyScalar<T>[];

    constructor(property: PropertyScalar<T>) {
        this.propertyList = [property];
    }

    getValidatedProperties(): AbstractProperty<T>[] {
        return this.propertyList;
    }

    getAdditionalProperties(): AbstractProperty<T>[] {
        return [];
    }

    abstract process(value: T | null): Promise<R>;
    abstract getMessagesFromResult(result: R): ValidationMessage[];
    abstract getMessageOnError(error: any): ValidationMessage | null;

    async validate(): Promise<ValidationResult> {
        const currentValue = this.propertyList[0].getValue();
        if (currentValue !== this.lastValue && this.lastValue === undefined) {
            return Promise.resolve(this.lastValidationResult);
        }
        try {
            const result = await this.process(currentValue);
            const msgs = this.getMessagesFromResult(result);
            this.lastValidationResult = {
                getMessages: (propertyId) => {
                    return msgs;
                }
            }
            return this.lastValidationResult;
        } catch (error) {
            const msg = this.getMessageOnError(error);
            this.lastValidationResult = {
                getMessages: (propertyId) => {
                    return msg && [msg];
                }
            }
            return this.lastValidationResult;
        }
    }

    getLastValidationResult(): ValidationResult {
        return this.lastValidationResult;
    }

    isAsynchronous(): boolean {
        return true;
    }

}
