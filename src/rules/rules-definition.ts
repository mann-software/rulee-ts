import { PropertyScalarRuleBuilder } from "../engine/builder/property-scalar-rule-builder";
import { AbstractProperty } from "../properties/abstract-property";

export interface RulesDefinition<T> {
    apply(builder: PropertyScalarRuleBuilder<T>): void;
}

export function rules<T>(apply: (builder: PropertyScalarRuleBuilder<T>) => void): RulesDefinition<T> {
    return {
        apply
    };
}

export function rulesWithDeps<T, Dependencies extends readonly AbstractProperty[]>(apply: (builder: PropertyScalarRuleBuilder<T>, ...dependencies: Dependencies) => void): (dependencies: Dependencies) => RulesDefinition<T> {
    return dependencies => new RulesDefinitionWithDependencies(dependencies, apply);
}

export function rulesComposed<T>(...defintions: RulesDefinition<T>[]): RulesDefinition<T> {
    return new RulesDefinitionComposition(defintions);
}

export function rulesAbstract<T>(): RulesDefinition<T> {
    return new AbstractRulesDefinition();
}


class RulesDefinitionWithDependencies<T, Dependencies extends readonly AbstractProperty[]> implements RulesDefinition<T> {

    constructor(
        protected dependencies: Dependencies,
        protected readonly applyFcn: (builder: PropertyScalarRuleBuilder<T>, ...dependencies: Dependencies) => void,
    ) { }

    apply(builder: PropertyScalarRuleBuilder<T>): void {
        this.applyFcn(builder, ...this.dependencies);
    }
}

class RulesDefinitionComposition<T> implements RulesDefinition<T> {

    constructor(
        private readonly definitions: RulesDefinition<T>[]
    ) { }

    apply(builder: PropertyScalarRuleBuilder<T>): void {
        this.definitions.forEach(def => def.apply(builder));
    }
}

export class AbstractRulesDefinition<T> implements RulesDefinition<T> {

    private implementation?: RulesDefinition<T>;

    apply(builder: PropertyScalarRuleBuilder<T>): void {
        if (!this.implementation) {
            throw new Error("No implementation provided");
        }
        this.implementation.apply(builder);
    }

    implementWith(implementation: RulesDefinition<T>): void {
        this.implementation = implementation;
    }
}
