import { GroupOfPropertiesRuleBuilder } from "../engine/builder/group-of-properties-rule-builder";
import { AbstractProperty } from "../properties/abstract-property";
import { PropertyGroup } from "../properties/group-of-properties";
import { AbstractRulesDefinition, RulesDefinition, RulesDefinitionComposition, RulesDefinitionWithDependencies } from "./rules-definition";

export type GroupOfPropertiesRulesDefinition<T extends PropertyGroup> = RulesDefinition<GroupOfPropertiesRuleBuilder<T>>;

export function groupRules<T extends PropertyGroup>(buildRules: (builder: GroupOfPropertiesRuleBuilder<T>) => void): GroupOfPropertiesRulesDefinition<T> {
    return {
        buildRules
    };
}

export function groupRulesWithDeps<T extends PropertyGroup, Dependencies extends readonly AbstractProperty[]>(buildRules: (builder: GroupOfPropertiesRuleBuilder<T>, ...dependencies: Dependencies) => void): (dependencies: Dependencies) => GroupOfPropertiesRulesDefinition<T> {
    return dependencies => new RulesDefinitionWithDependencies(dependencies, buildRules);
}

export function groupRulesComposed<T extends PropertyGroup>(...defintions: GroupOfPropertiesRulesDefinition<T>[]): GroupOfPropertiesRulesDefinition<T> {
    return new RulesDefinitionComposition(defintions);
}

export function groupRulesAbstract<T extends PropertyGroup>(): AbstractRulesDefinition<GroupOfPropertiesRuleBuilder<T>> {
    return new AbstractRulesDefinition();
}
