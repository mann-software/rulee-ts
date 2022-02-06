import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfProperties, PropertyGroup } from "../../properties/group-of-properties";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { GroupOfPropertiesValidator } from "../../validators/property-validator";
import { CrossValidationResult } from "../../validators/cross-validation-result";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AsyncGroupOfPropertiesValidator } from "../../validators/async-property-validator";

export class GroupOfPropertiesRuleBuilder<T extends PropertyGroup> {

    private readonly property: GroupOfPropertiesImpl<T>;
    
    constructor(
        property: GroupOfProperties<T>,
        private readonly addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
    ) {
        this.property = property as GroupOfPropertiesImpl<T>;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: GroupOfPropertiesValidator<T, Dependencies>) => GroupOfPropertiesRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addPropertyValidator(validator);
            return this;
        };
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncGroupOfPropertiesValidator<T, Dependencies>) => GroupOfPropertiesRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addAsyncPropertyValidator(validator, dependencies);
            return this;
        };
    }

    addCrossValidator(validator: (group: T) => CrossValidationResult | Promise<CrossValidationResult>): GroupOfPropertiesRuleBuilder<T> {
        const instance: ValidatorInstance<readonly AbstractProperty[]> = {
            validationArguments: this.property.propertiesAsList,
            validate: () => validator(this.property.properties)
        };
        this.property.addValidator(instance);
        return this;
    }
    
    // ------------------
    
}
