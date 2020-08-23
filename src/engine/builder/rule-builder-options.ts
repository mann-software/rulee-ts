import { ValidationMessage } from "../../validators/validation-message";

export interface RuleBuilderOptions {
    emptyButRequiredMessage: (() => ValidationMessage) | ValidationMessage;
}
