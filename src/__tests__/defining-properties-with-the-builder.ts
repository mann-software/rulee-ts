import { ruleEngineBuilderFactory } from "./utils/test-utils";

test('need to call RuleEngineBuilder.initialise() else error is thrown', () => {
    const ruleEngineBuilder = ruleEngineBuilderFactory();

    const prop = ruleEngineBuilder.scalar.booleanProperty('PROP');

    // forgot to call: ruleEngineBuilder.initialise()
    expect(prop.getValue()).toThrowError();
});

test('no duplicated property id´s else error is thrown', () => {
    const ruleEngineBuilder = ruleEngineBuilderFactory();
    ruleEngineBuilder.scalar.booleanProperty('PROP');
    expect(ruleEngineBuilder.scalar.numberProperty('PROP')).toThrowError();
});
