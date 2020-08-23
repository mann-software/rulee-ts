import { ValidationError } from '../../validators/validation-type';
import { ValidationMessage } from '../../validators/validation-message';
import { RuleEngine } from '../../engine/rule-engine';
import { RuleBuilder } from '../../engine/builder/rule-builder';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationError,
    text: 'Must not be empty'
};

export const ruleBuilderAndEngineFactory: () => [RuleBuilder, RuleEngine] = () => {
    const ruleEngine = new RuleEngine();
    return [ruleEngine.builder({ emptyButRequiredMessage }), ruleEngine];
};
