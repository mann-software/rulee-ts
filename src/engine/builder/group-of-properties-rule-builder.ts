import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfProperties, PropertyGroup, PropertyGroupData } from "../../properties/group-of-properties";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { GroupOfPropertiesValidator } from "../../validators/property-validator";
import { CrossValidationResult } from "../../validators/cross-validation-result";
import { CrossValidatorInstance } from "../validation/validator-instance-impl";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AsyncGroupOfPropertiesValidator } from "../../validators/async-property-validator";
import { AbstractParentPropertyRuleBuilder } from "./abstract-parent-property-rule-builder-impl";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";

export class GroupOfPropertiesRuleBuilder<T extends PropertyGroup> extends AbstractParentPropertyRuleBuilder<PropertyGroupData<T>, GroupOfPropertiesImpl<T>> {

    constructor(
        property: GroupOfProperties<T>,
        addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        super(property as GroupOfPropertiesImpl<T>, addDependencies, textInterpreters);
    }

    protected getChildren(): AbstractProperty[] {
        return this.property.propertiesAsList;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: GroupOfPropertiesValidator<T, Dependencies>) => GroupOfPropertiesRuleBuilder<T> {
        return this.addValidatorInternal(...dependencies);
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncGroupOfPropertiesValidator<T, Dependencies>) => GroupOfPropertiesRuleBuilder<T> {
        return this.addAsyncValidatorInternal(...dependencies);
    }

    addCrossValidator(validator: (group: T) => CrossValidationResult | Promise<CrossValidationResult>): GroupOfPropertiesRuleBuilder<T> {
        const instance: CrossValidatorInstance<readonly AbstractProperty[]> = {
            validationArguments: this.property.propertiesAsList,
            validate: () => validator(this.property.properties)
        };
        this.property.addValidator(instance);
        return this;
    }
    
    // ------------------
    
}
