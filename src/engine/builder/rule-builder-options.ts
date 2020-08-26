import { ValidationMessage } from "../../validators/validation-message";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";

export interface RuleBuilderOptions {
    emptyButRequiredMessage: (() => ValidationMessage) | ValidationMessage;
    defaultBackpressureConfig?: BackpressureConfig;
}
