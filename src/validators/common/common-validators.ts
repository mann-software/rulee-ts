import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarValidator } from "../single-property-validator";
import { ValidationMessage } from "../validation-message";

export const V = {
    notEmpty: (msg: ValidationMessage) => NotEmptyIfRequiredValidator(() => msg),
    notEmptyMsgProvider: (valiationMsgProvider: () => ValidationMessage) => NotEmptyIfRequiredValidator(valiationMsgProvider),
}

export const NotEmptyIfRequiredValidator = (valiationMessageProvider: () => ValidationMessage) => ((property: PropertyScalar<unknown>) => {
    if (!property.isEmpty() || !property.isRequired()) {
        return null;
    } else {
        return valiationMessageProvider();
    }
}) as PropertyScalarValidator<unknown>;
