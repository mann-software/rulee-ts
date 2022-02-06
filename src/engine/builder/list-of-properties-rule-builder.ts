import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { AbstractProperty } from "../../properties/abstract-property";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { ListOfPropertiesValidator } from "../../validators/property-validator";
import { ValidationMessage } from "../../validators/validation-message";

export class ListOfPropertiesRuleBuilder<T extends AbstractDataProperty<D>, D> {

    private readonly property: ListOfPropertiesImpl<T, D>;
    
    constructor(
        property: ListOfProperties<T, D>,
        private readonly addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
    ) {
        this.property = property as ListOfPropertiesImpl<T, D>;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: ListOfPropertiesValidator<T, D, Dependencies>) => ListOfPropertiesRuleBuilder<T, D> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addPropertyValidator(validator);
            return this;
        };
    }

    addAsyncValidator(validator: (property: ListOfProperties<T, D>) => Promise<ValidationMessage[] | undefined>): ListOfPropertiesRuleBuilder<T, D> {
        const propList = [this.property];
        this.property.addValidator({
            getValidatedProperties: () => propList,
            validate: (prop) => validator(prop as ListOfProperties<T, D>)
        });
        return this;
    }
    
    // ------------------
    
}
