import { AbstractProperty } from "../properties/abstract-property";

export interface RulesDefinition<RuleBuilder> {
    buildRules(builder: RuleBuilder): void;
}

export class RulesDefinitionWithDependencies<RuleBuilder, Dependencies extends readonly AbstractProperty[]> implements RulesDefinition<RuleBuilder> {

    constructor(
        protected dependencies: Dependencies,
        protected readonly buildRulesFcn: (builder: RuleBuilder, ...dependencies: Dependencies) => void,
    ) { }

    buildRules(builder: RuleBuilder): void {
        this.buildRulesFcn(builder, ...this.dependencies);
    }
}

export class RulesDefinitionComposition<RuleBuilder> implements RulesDefinition<RuleBuilder> {

    constructor(
        private readonly definitions: RulesDefinition<RuleBuilder>[]
    ) { }

    buildRules(builder: RuleBuilder): void {
        this.definitions.forEach(def => def.buildRules(builder));
    }
}

export class AbstractRulesDefinition<RuleBuilder> implements RulesDefinition<RuleBuilder> {

    private implementation?: RulesDefinition<RuleBuilder>;

    buildRules(builder: RuleBuilder): void {
        if (!this.implementation) {
            throw new Error("No implementation provided");
        }
        this.implementation.buildRules(builder);
    }

    implementWith(implementation: RulesDefinition<RuleBuilder>): void {
        this.implementation = implementation;
    }
}
