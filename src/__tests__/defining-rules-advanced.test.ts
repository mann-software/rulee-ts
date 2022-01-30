import { AbstractProperty } from "../properties/abstract-property";
import { rules, rulesAbstract, rulesComposed, rulesWithDeps, ScalarRulesDefinition } from "../rules/scalar-rules-definition";
import { PropertyScalarValidator } from "../validators/single-property-validator";
import { ValidationType } from "../validators/validation-type";
import { builderAndRuleEngineFactory } from "./utils/test-utils";

test('define rules once and use for different types of properties', () => {
    const [builder] = builderAndRuleEngineFactory();
    
    const reusableRules = rulesWithDeps((builder, someProp: AbstractProperty) => {
        builder.setRequiredIfVisible(true)
            .setToInitialStateOnOtherPropertyChanged(someProp);
    });

    const someProp = builder.scalar.dateProperty('SOME_PROP');

    const propA = builder.scalar.stringProperty('PROP_A', {}, reusableRules([someProp]) as ScalarRulesDefinition<string>);
    const propB = builder.scalar.numberProperty('PROP_B', {}, reusableRules([someProp]) as ScalarRulesDefinition<number>);

    expect(propA.isRequired()).toBe(true);
    expect(propB.isRequired()).toBe(true);

    propA.setValue('some value');
    propB.setValue(7);

    someProp.setValue(new Date());

    expect(propA.getValue()).toBe(propA.getInitialValue());
    expect(propB.getValue()).toBe(propB.getInitialValue());
});

test('define composed rules', () => {
    const [builder] = builderAndRuleEngineFactory();
    let lastLog = '';
    
    const placeholderRule = rules(builder => {
        builder.definePlaceholder('Please fill');
    });
    const mandatoryRule = rules(builder => {
        builder.setRequiredIfVisible(true);
    });
    const mandatoryWithHintRule = rulesComposed(placeholderRule, mandatoryRule);

    const loggingRule = rules<string>(builder => {
        builder.onUpdated(prop => lastLog = prop.getNonNullValue());
    });

    const composition = rulesComposed<string>(mandatoryWithHintRule as ScalarRulesDefinition<string>, loggingRule);


    const someProp = builder.scalar.stringProperty('SOME_PROP', {}, composition);
    expect(someProp.isRequired()).toBe(true);
    expect(someProp.getPlaceholder()).toBe('Please fill');
    
    someProp.setValue('value');
    expect(lastLog).toBe('value');
});

test('define abstract rules', () => {
    const [builder] = builderAndRuleEngineFactory();
    
    const abstractRule = rulesAbstract<number>();

    const someProp = builder.scalar.numberProperty('SOME_PROP');

    expect(() => builder.scalar.bind(someProp, abstractRule)).toThrowError('No implementation provided');
    
    const notGreaterThan42Validator: PropertyScalarValidator<number> = prop => {
        if (prop.getNonNullValue() > 42) {
            return {
                text: 'Must not be greater than 42',
                type: ValidationType.Error
            }
        }
    };
    abstractRule.implementWith(rules(builder => {
        builder.addValidator(notGreaterThan42Validator);
    }));
    builder.scalar.bind(someProp, abstractRule);

    someProp.setValue(43);
    void someProp.validate();
    expect(someProp.getValidationMessages().length).toBe(1);
});
