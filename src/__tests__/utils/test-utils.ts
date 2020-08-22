import { ValidationError } from '../../validators/validation-type';
import { ValidationMessage } from '../../validators/validation-message';
import { RuleEngine } from '../../engine/rule-engine';
import { RuleEngineBuilder } from '../../engine/builder/rule-engine-buider';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationError,
    text: 'Must not be empty'
};

export const ruleEngineAndBuilderFactory: () => [RuleEngineBuilder, RuleEngine] = () => {
    const ruleEngine = new RuleEngine();
    return [ruleEngine.builder({ emptyButRequiredMessage }), ruleEngine];
};
