import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyArrayList } from "../../properties/property-array-list";
import { PropertyArrayListImpl } from "../../properties/property-array-list-impl";
import { AsyncPropertyArrayListValidator } from "../../validators/async-property-validator";
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
            this.property.addPropertyValidator(validator, dependencies);
            return this;
        };
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncPropertyArrayListValidator<T, Dependencies>) => PropertyArrayListRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addAsyncPropertyValidator(validator, dependencies);
            return this;
        };
    }
    
    // ------------------
    
}
