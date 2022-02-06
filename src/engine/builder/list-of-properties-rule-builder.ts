import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { AsyncListOfPropertiesValidator } from "../../index";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { AbstractProperty } from "../../properties/abstract-property";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { ListOfPropertiesValidator } from "../../validators/property-validator";

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
            this.property.addPropertyValidator(validator, dependencies);
            return this;
        };
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncListOfPropertiesValidator<T, D, Dependencies>) => ListOfPropertiesRuleBuilder<T, D> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.property.addAsyncPropertyValidator(validator, dependencies);
            return this;
        };
    }
    
    // ------------------
    
}
