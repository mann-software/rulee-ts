import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfProperties, PropertyGroup } from "../../properties/group-of-properties";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { GroupOfPropertiesValidator } from "../../validators/property-validator";
import { CrossValidationResult } from "../../validators/cross-validation-result";
import { ValidatorInstance } from "../validation/validator-instance-impl";

export class GroupOfPropertiesRuleBuilder<T extends PropertyGroup> {

    private readonly property: GroupOfPropertiesImpl<T>;
    
    constructor(
        property: GroupOfProperties<T>,
    ) {
        this.property = property as GroupOfPropertiesImpl<T>;
    }

    // ------------------

    addValidator(validator: GroupOfPropertiesValidator<T>): GroupOfPropertiesRuleBuilder<T> {
        this.property.addPropertyValidator(validator);
        return this;
    }

    addCrossValidator(validator: (group: T) => CrossValidationResult | Promise<CrossValidationResult>): GroupOfPropertiesRuleBuilder<T> {
        const instance: ValidatorInstance<readonly AbstractProperty[]> = {
            getValidatedProperties: () => this.property.propertiesAsList,
            validate: () => validator(this.property.properties)
        };
        this.property.addValidator(instance);
        return this;
    }
    
    // ------------------
    
}
