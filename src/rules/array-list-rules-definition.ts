import { PropertyArrayListRuleBuilder } from "../engine/builder/property-array-list-rule-builder";
import { AbstractProperty } from "../properties/abstract-property";
import { AbstractRulesDefinition, RulesDefinition, RulesDefinitionComposition, RulesDefinitionWithDependencies } from "./rules-definition";

export type ArrayListRulesDefinition<T> = RulesDefinition<PropertyArrayListRuleBuilder<T>>;

export function arrayListRules<T>(buildRules: (builder: PropertyArrayListRuleBuilder<T>) => void): ArrayListRulesDefinition<T> {
    return {
        buildRules
    };
}

export function arrayListRulesWithDeps<T, Dependencies extends readonly AbstractProperty[]>(buildRules: (builder: PropertyArrayListRuleBuilder<T>, ...dependencies: Dependencies) => void): (dependencies: Dependencies) => ArrayListRulesDefinition<T> {
    return dependencies => new RulesDefinitionWithDependencies(dependencies, buildRules);
}

export function arrayListRulesComposed<T>(...defintions: ArrayListRulesDefinition<T>[]): ArrayListRulesDefinition<T> {
    return new RulesDefinitionComposition(defintions);
}

export function arrayListRulesAbstract<T>(): AbstractRulesDefinition<PropertyArrayListRuleBuilder<T>> {
    return new AbstractRulesDefinition();
}
