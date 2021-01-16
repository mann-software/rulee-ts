import { ValidationTypes } from '../../validators/validation-type';
import { ValidationMessage } from '../../validators/validation-message';
import { RuleEngine } from '../../engine/rule-engine';
import { Builder } from '../../engine/builder/builder';
import { BuilderOptions } from '../../engine/builder/builder-options';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationTypes.Error,
    text: 'Must not be empty'
};

const defaultOptions: BuilderOptions = { emptyButRequiredMessage };

export const builderAndRuleEngineFactory: (options?: Partial<BuilderOptions>) => [Builder, RuleEngine] = (options?: Partial<BuilderOptions>) => {
    const mergedOptions = !options ? defaultOptions : { ...defaultOptions, ...options };
    const ruleEngine = new RuleEngine(mergedOptions);
    return [ruleEngine.getBuilder(), ruleEngine];
};
