import { ListOfPropertiesRuleBuilder } from "../engine/builder/list-of-properties-rule-builder";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { AbstractProperty } from "../properties/abstract-property";
import { AbstractRulesDefinition, RulesDefinition, RulesDefinitionComposition, RulesDefinitionWithDependencies } from "./rules-definition";

export type ListOfPropertiesRulesDefinition<T extends AbstractDataProperty<D>, D> = RulesDefinition<ListOfPropertiesRuleBuilder<T, D>>;

export function listOfPropertiesRules<T extends AbstractDataProperty<D>, D>(apply: (builder: ListOfPropertiesRuleBuilder<T, D>) => void): ListOfPropertiesRulesDefinition<T, D> {
    return {
        apply
    };
}

export function listOfPropertiesRulesWithDeps<T extends AbstractDataProperty<D>, D, Dependencies extends readonly AbstractProperty[]>(apply: (builder: ListOfPropertiesRuleBuilder<T, D>, ...dependencies: Dependencies) => void): (dependencies: Dependencies) => ListOfPropertiesRulesDefinition<T, D> {
    return dependencies => new RulesDefinitionWithDependencies(dependencies, apply);
}

export function listOfPropertiesRulesComposed<T extends AbstractDataProperty<D>, D>(...defintions: ListOfPropertiesRulesDefinition<T, D>[]): ListOfPropertiesRulesDefinition<T, D> {
    return new RulesDefinitionComposition(defintions);
}

export function listOfPropertiesRulesAbstract<T extends AbstractDataProperty<D>, D>(): AbstractRulesDefinition<ListOfPropertiesRuleBuilder<T, D>> {
    return new AbstractRulesDefinition();
}
