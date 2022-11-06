import { RuleEngine, createRuleEngine } from '../../engine/rule-engine';
import { Builder } from '../../engine/builder/builder';
import { BuilderOptions } from '../../engine/builder/builder-options';
import { PropertyArrayListCrudAsync } from '../../properties/property-array-list';
import { PropertyScalar } from '../../properties/property-scalar';
import { executeAfterTime, valueAfterTime } from './timing-utils';
import { SemanticRulesVersion } from '../../engine/data/rules-version';
import { ValidationMessage } from '../../validators/validation-message';
import { ValidationType } from '../../validators/validation-type';

export const emptyButRequiredMessage: ValidationMessage = {
    type: ValidationType.Error,
    text: 'Must not be empty'
};

const defaultOptions: BuilderOptions = { 
    version: SemanticRulesVersion(1, 0, 0),
};

export const builderAndRuleEngineFactory: (options?: Partial<BuilderOptions>) => [Builder, RuleEngine] = (options?: Partial<BuilderOptions>) => {
    const mergedOptions = !options ? defaultOptions : { ...defaultOptions, ...options };
    const ruleEngine = createRuleEngine(mergedOptions);
    return [ruleEngine.getBuilder(), ruleEngine];
};

export function setupAsyncCrudList(): [PropertyArrayListCrudAsync<number>, PropertyScalar<string>] {
    const resources: Record<string, number[]> = {
        'a': [1, 2, 3],
        'b': [5]
    };
    const [builder] = builderAndRuleEngineFactory();

    const id = builder.scalar.stringProperty('ID', { initialValue: 'a' });
    const list = builder.list.crud.async('LIST', id)<number>({
        getElements: (id) => valueAfterTime(resources[id.getNonNullValue()].slice() ?? [], 200),
        addElement: (data, index) => executeAfterTime(() => {
            if (!resources[id.getNonNullValue()]) {
                resources[id.getNonNullValue()] = [];
            }
            if (index !== undefined) {
                resources[id.getNonNullValue()].splice(index, 0, data);
            } else {
                resources[id.getNonNullValue()].push(data);
            }
        }, 200),
        removeElement: (index) => executeAfterTime(() => {
            if (index % 2 === 1) {
                throw new Error("removeElement: sync error");
            } 
            resources[id.getNonNullValue()].splice(index, 1);
        }, 200),
        updateElement: (data, index) => executeAfterTime(() => {
            resources[id.getNonNullValue()].splice(index, 1, data);
        }, 200),
    });

    return [list, id];
}
