import { ValidationMessage } from "../../validators/validation-message";

export interface RuleEngineBuilderOptions {
    emptyButRequiredMessage: (() => ValidationMessage) | ValidationMessage;
}
