import { PropertyScalar, rules, rulesWithDeps, ValidationMessage } from "../../../index";

export const notEmptyRule = rules(builder => {
    builder.setRequiredIfVisible(true)
});

export const notEmptyIfSomeOtherNotEmpty = (message: ValidationMessage) => rulesWithDeps((builder, ...otherProps: PropertyScalar<unknown>[]) => {
    builder.addValidator(...otherProps)((self, ...dependencies) => {
        if (self.isEmpty() && dependencies.some(dep => !dep.isEmpty())) {
            return message;
        }
    })
});
