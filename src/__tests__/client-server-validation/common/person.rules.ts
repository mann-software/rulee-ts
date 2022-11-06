import { PropertyScalar, rules, rulesWithDeps, ValidationMessage } from "../../../index";
import { requiredIfVisibleRule } from "../../../rules/common/common-scalar-rules";
import { emptyButRequiredMessage } from "../../utils/test-utils";

export const notEmptyRule = requiredIfVisibleRule(() => emptyButRequiredMessage);

export const notEmptyIfSomeOtherNotEmpty = (message: ValidationMessage) => rulesWithDeps((builder, ...otherProps: PropertyScalar<unknown>[]) => {
    builder.addValidator(...otherProps)((self, ...dependencies) => {
        if (self.isEmpty() && dependencies.some(dep => !dep.isEmpty())) {
            return message;
        }
    })
});
