import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { ListOfProperties } from "../../properties/list-of-properties";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { SinglePropertyValidator } from "../../validators/single-property-validator";
import { ValidationMessage } from "../../validators/validation-message";

export class ListOfPropertiesRuleBuilder<T extends AbstractDataProperty<D>, D> {

    private readonly property: ListOfPropertiesImpl<T, D>;
    
    constructor(
        property: ListOfProperties<T, D>,
    ) {
        this.property = property as ListOfPropertiesImpl<T, D>;
    }

    // ------------------

    addValidator(validator: SinglePropertyValidator<ListOfProperties<T, D>>): ListOfPropertiesRuleBuilder<T, D> {
        this.property.addSinglePropertyValidator(validator);
        return this;
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
