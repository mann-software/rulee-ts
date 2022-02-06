import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyArrayList } from "../../properties/property-array-list";
import { PropertyArrayListImpl } from "../../properties/property-array-list-impl";
import { PropertyArrayListValidator } from "../../validators/property-validator";
import { ValidationMessage } from "../../validators/validation-message";

export class PropertyArrayListRuleBuilder<T> {

    private readonly property: PropertyArrayListImpl<T>;
    
    constructor(
        property: PropertyArrayList<T>,
        private readonly addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
    ) {
        this.property = property as PropertyArrayListImpl<T>;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: PropertyArrayListValidator<T, Dependencies>) => PropertyArrayListRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addPropertyValidator(validator);
            return this;
        };
    }

    addAsyncValidator(validator: (property: PropertyArrayList<T>) => Promise<ValidationMessage[] | undefined>): PropertyArrayListRuleBuilder<T> {
        const propList = [this.property];
        this.property.addValidator({
            getValidatedProperties: () => propList,
            validate: (prop) => validator(prop as unknown as PropertyArrayList<T>)
        });
        return this;
    }
    
    // ------------------
    
}
