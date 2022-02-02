import { PropertyScalar, rules, rulesWithDeps, ValidationMessage } from "../../../index";

export const notEmptyRule = rules(builder => {
    builder.setRequiredIfVisible(true)
});

export function notEmptyIfSomeOtherNotEmpty<T, Other extends readonly PropertyScalar<unknown>[]>(message: ValidationMessage, ...otherProps: Other) {
    return rulesWithDeps<T, Other>((builder, ...otherProps) => {
        builder.addValidator(self => {
            if (self.isEmpty() && otherProps.some(other => !other.isEmpty())) {
                return message;
            }
        })
    })(otherProps);
}
