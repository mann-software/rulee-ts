import { AbstractProperty } from "../properties/abstract-property";

export interface RulesDefinition<RuleBuilder> {
    apply(builder: RuleBuilder): void;
}

export class RulesDefinitionWithDependencies<RuleBuilder, Dependencies extends readonly AbstractProperty[]> implements RulesDefinition<RuleBuilder> {

    constructor(
        protected dependencies: Dependencies,
        protected readonly applyFcn: (builder: RuleBuilder, ...dependencies: Dependencies) => void,
    ) { }

    apply(builder: RuleBuilder): void {
        this.applyFcn(builder, ...this.dependencies);
    }
}

export class RulesDefinitionComposition<RuleBuilder> implements RulesDefinition<RuleBuilder> {

    constructor(
        private readonly definitions: RulesDefinition<RuleBuilder>[]
    ) { }

    apply(builder: RuleBuilder): void {
        this.definitions.forEach(def => def.apply(builder));
    }
}

export class AbstractRulesDefinition<RuleBuilder> implements RulesDefinition<RuleBuilder> {

    private implementation?: RulesDefinition<RuleBuilder>;

    apply(builder: RuleBuilder): void {
        if (!this.implementation) {
            throw new Error("No implementation provided");
        }
        this.implementation.apply(builder);
    }

    implementWith(implementation: RulesDefinition<RuleBuilder>): void {
        this.implementation = implementation;
    }
}
