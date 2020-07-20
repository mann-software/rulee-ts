import { Validator, ValidationResult, ValidationPassed } from "./validator";
import { AbstractProperty } from "../properties/abstract-property";
import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";
import { PropertyId } from "../properties/property-id";

export abstract class AsynchronousValidator<T, R> implements Validator {

    private lastValidationResult = ValidationPassed;

    constructor(
        private readonly validatedProperties: PropertyScalar<T>[], 
        private readonly furtherProperties: PropertyScalar<T>[]
    ) { }

    getValidatedProperties(): AbstractProperty<T>[] {
        return this.validatedProperties;
    }

    getAdditionalProperties(): AbstractProperty<T>[] {
        return this.furtherProperties;
    }

    abstract needsValidation(validatedProperties: PropertyScalar<T>[], furtherProperties: PropertyScalar<T>[]): boolean;
    abstract process(validatedProperties: PropertyScalar<T>[], furtherProperties: PropertyScalar<T>[]): Promise<R>;
    /**
     * Extract the messages from the async validation result
     * @param result map to differentiate between properties or one array for all valitdated properties
     */
    abstract getMessagesFromResult(result: R): Map<PropertyId, ValidationMessage[]> | ValidationMessage[];
    /**
     * Provide an error messsage for all validated properties in case the validation processing failed
     * @param error error thrown during async processing
     */
    abstract getMessageOnError(error: Error): ValidationMessage;

    async validate(): Promise<ValidationResult> {
        if (!this.needsValidation(this.validatedProperties, this.furtherProperties)) {
            return this.lastValidationResult;
        }
        try {
            const result = await this.process(this.validatedProperties, this.furtherProperties);
            const msgs = this.getMessagesFromResult(result);
            if (msgs == null || msgs instanceof Array) {
                this.lastValidationResult = {
                    getMessages: (propertyId) => {
                        return msgs;
                    }
                }
            } else {
                this.lastValidationResult = {
                    getMessages: (propertyId) => {
                        return msgs.get(propertyId) ?? null;
                    }
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
