import { ValidationMessage } from "../../validators/validation-message";

export interface RuleEngineBuilderOptions {
    emptyButMandatoryMessage: (() => ValidationMessage) | ValidationMessage
}
