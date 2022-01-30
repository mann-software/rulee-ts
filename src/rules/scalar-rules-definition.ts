import { PropertyScalarRuleBuilder } from "../engine/builder/property-scalar-rule-builder";
import { AbstractProperty } from "../properties/abstract-property";
import { AbstractRulesDefinition, RulesDefinition, RulesDefinitionComposition, RulesDefinitionWithDependencies } from "./rules-definition";

export type ScalarRulesDefinition<T> = RulesDefinition<PropertyScalarRuleBuilder<T>>;

export function rules<T>(apply: (builder: PropertyScalarRuleBuilder<T>) => void): ScalarRulesDefinition<T> {
    return {
        apply
    };
}

export function rulesWithDeps<T, Dependencies extends readonly AbstractProperty[]>(apply: (builder: PropertyScalarRuleBuilder<T>, ...dependencies: Dependencies) => void): (dependencies: Dependencies) => ScalarRulesDefinition<T> {
    return dependencies => new RulesDefinitionWithDependencies(dependencies, apply);
}

export function rulesComposed<T>(...defintions: ScalarRulesDefinition<T>[]): ScalarRulesDefinition<T> {
    return new RulesDefinitionComposition(defintions);
}

export function rulesAbstract<T>(): AbstractRulesDefinition<PropertyScalarRuleBuilder<T>> {
    return new AbstractRulesDefinition();
}
