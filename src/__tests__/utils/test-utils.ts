import { RuleEngineBuilder } from '../../engine/builder/rule-engine-buider';
import { ValidationError } from '../../validators/validation-type';
import { ValidationMessage } from '../../validators/validation-message';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationError,
    text: 'Must not be empty'
};

export const ruleEngineBuilderFactory = () => new RuleEngineBuilder({ emptyButRequiredMessage });
