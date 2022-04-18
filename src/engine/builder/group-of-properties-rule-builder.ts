import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfProperties, PropertyGroup, PropertyGroupData } from "../../properties/group-of-properties";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { GroupOfPropertiesValidator } from "../../validators/property-validator";
import { CrossValidationResult } from "../../validators/cross-validation-result";
import { CrossValidatorInstance } from "../validation/validator-instance-impl";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AsyncGroupOfPropertiesValidator } from "../../validators/async-property-validator";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { ValidationMessage } from "../../validators/validation-message";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";

export class GroupOfPropertiesRuleBuilder<T extends PropertyGroup> extends AbstractPropertyRuleBuilder<PropertyGroupData<T>, GroupOfPropertiesImpl<T>> {

    constructor(
        property: GroupOfProperties<T>,
        addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        super(property as GroupOfPropertiesImpl<T>, addDependencies, textInterpreters);
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

    defineVisibleIfAllMembersVisible() {
        this.defineVisibility(...this.property.propertiesAsList)((self, ...children) =>
            children.every(child => child.isVisible())
        );
    }

    defineValidIfAllMembersValid(message: (invalidChildren: AbstractProperty[]) => ValidationMessage) {
        this.addAsyncValidatorInternal(...this.property.propertiesAsList)(async (self, ...children) => {
            await Promise.all(children.map(child => child.validate()));
            const invalidChildren = children.filter(child => child.isValid());
            if (invalidChildren.length > 0) {
                return message(invalidChildren);
            }
        });
    }
    
}
