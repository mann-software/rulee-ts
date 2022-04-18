import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyArrayList } from "../../properties/property-array-list";
import { PropertyArrayListAsyncImpl } from "../../properties/property-array-list-impl";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { AsyncPropertyArrayListValidator } from "../../validators/async-property-validator";
import { PropertyArrayListValidator } from "../../validators/property-validator";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";

export class PropertyArrayListRuleBuilder<T> extends AbstractPropertyRuleBuilder<T[], PropertyArrayListAsyncImpl<T>> {

    constructor(
        property: PropertyArrayList<T>,
        addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        super(property as PropertyArrayListAsyncImpl<T>, addDependencies, textInterpreters);
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: PropertyArrayListValidator<T, Dependencies>) => PropertyArrayListRuleBuilder<T> {
        return this.addValidatorInternal(...dependencies);
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncPropertyArrayListValidator<T, Dependencies>) => PropertyArrayListRuleBuilder<T> {
        return this.addAsyncValidatorInternal(...dependencies);
    }

    // ------------------
    
}
