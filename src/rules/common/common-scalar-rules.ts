import { PropertyScalar } from "../../properties/property-scalar";
import { notEmptyIfRequiredValidator } from "../../validators/common/common-scalar-validators";
import { ValidationMessage } from "../../validators/validation-message";
import { rules } from "../scalar-rules-definition";

export const requiredIfVisibleRule = <T>(valiationMessageProvider: (property: PropertyScalar<T>) => ValidationMessage) => rules<T>(builder => {
    builder.setRequiredIfVisible(true).addValidator()(notEmptyIfRequiredValidator(valiationMessageProvider));
});
