import { ruleBuilderAndEngineFactory } from "./utils/test-utils";
import { RuleBuilder } from "../engine/builder/rule-builder";
import { C } from "../value-converter/common-value-converters";

let ruleBuilder: RuleBuilder;

beforeEach(() => {
    [ruleBuilder] = ruleBuilderAndEngineFactory();
});

test('async validation test', () => {
    expect(true).toBe(true);
    // TODO write tests
});
