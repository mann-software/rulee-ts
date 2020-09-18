import { ValidationError } from '../../validators/validation-type';
import { ValidationMessage } from '../../validators/validation-message';
import { RuleEngine } from '../../engine/rule-engine';
import { RuleBuilder } from '../../engine/builder/rule-builder';
import { RuleBuilderOptions } from '../../engine/builder/rule-builder-options';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationError,
    text: 'Must not be empty'
};

const defaultOptions: RuleBuilderOptions = { emptyButRequiredMessage };

export const ruleBuilderAndEngineFactory: (options?: Partial<RuleBuilderOptions>) => [RuleBuilder, RuleEngine] = (options?: Partial<RuleBuilderOptions>) => {
    const ruleEngine = new RuleEngine();
    const mergedOptions = !options ? defaultOptions : { ...defaultOptions, ...options };
    return [ruleEngine.builder(mergedOptions), ruleEngine];
};
