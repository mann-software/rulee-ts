import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { AbstractProperty } from "../../properties/abstract-property";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { AsyncListOfPropertiesValidator } from "../../validators/async-property-validator";
import { ListOfPropertiesValidator } from "../../validators/property-validator";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";

export class ListOfPropertiesRuleBuilder<T extends AbstractDataProperty<D>, D> extends AbstractPropertyRuleBuilder<(D | null)[], ListOfPropertiesImpl<T, D>> {
    
    constructor(
        property: ListOfProperties<T, D>,
        addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        super(property as ListOfPropertiesImpl<T, D>, addDependencies, textInterpreters);
    }

    protected getChildren(): AbstractProperty[] {
        return this.property.list;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: ListOfPropertiesValidator<T, D, Dependencies>) => ListOfPropertiesRuleBuilder<T, D> {
        return this.addValidatorInternal(...dependencies);
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncListOfPropertiesValidator<T, D, Dependencies>) => ListOfPropertiesRuleBuilder<T, D> {
        return this.addAsyncValidatorInternal(...dependencies);
    }

    // ------------------
    
}
