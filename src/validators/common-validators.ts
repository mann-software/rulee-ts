import { PropertyScalar } from "../properties/property-scalar";
import { ValidationMessage } from "./validation-message";
import { ScalarValidator } from "./validator";

export const V = {
    conditional: <T>(validators: { condition: boolean, validator: ScalarValidator<T> }[]) => new ConditionalValidator(validators.map(v => ({ condition: v.condition, valideFcn: v.validator.validate }))),
    conditionalFcns: <T>(validators: { condition: boolean, valideFcn: (property: PropertyScalar<T>) => ValidationMessage | null }[]) => new ConditionalValidator(validators),
    notEmpty: (msg: ValidationMessage) => new NotEmptyIfRequiredValidator(() => msg),
    notEmptyMsgProvider: (valiationMsgProvider: () => ValidationMessage) => new NotEmptyIfRequiredValidator(valiationMsgProvider),
}

/**
 * First validator whose condition evaluates to true is executed
 */
export class ConditionalValidator<T> implements ScalarValidator<T> {

    constructor (protected validators: { condition: boolean, valideFcn: (property: PropertyScalar<T>) => ValidationMessage | null}[]) { }

    validate(property: PropertyScalar<T>): ValidationMessage | null {
        return this.validators.find(v => v.condition)?.valideFcn(property) ?? null;
    }

}

export class NotEmptyIfRequiredValidator implements ScalarValidator<any> {

    /**
     * @param valiationMessageProvider as function for e.g. internationalization
     */
    constructor (protected valiationMessageProvider: () => ValidationMessage) { }

    validate(property: PropertyScalar<any>): ValidationMessage | null {
        if (!property.isEmpty() || !property.isRequired()) {
            return null;
        } else {
            return this.valiationMessageProvider();
        }
    }

}
