import { PropertyArrayList } from "../../properties/property-array-list";
import { PropertyArrayListImpl } from "../../properties/property-array-list-impl";
import { SinglePropertyValidator } from "../../validators/single-property-validator";
import { ValidationMessage } from "../../validators/validation-message";

export class PropertyArrayListRuleBinding<T> {

    private readonly property: PropertyArrayListImpl<T>;
    
    constructor(
        property: PropertyArrayList<T>,
    ) {
        this.property = property as unknown as PropertyArrayListImpl<T>;
    }

    // ------------------

    addValidator(validator: SinglePropertyValidator<PropertyArrayList<T>>): PropertyArrayListRuleBinding<T> {
        this.property.addSinglePropertyValidator(validator);
        return this;
    }

    addAsyncValidator(validator: (property: PropertyArrayList<T>) => Promise<ValidationMessage[] | undefined>): PropertyArrayListRuleBinding<T> {
        const propList = [this.property];
        this.property.addValidator({
            getValidatedProperties: () => propList,
            validate: (prop) => validator(prop as unknown as PropertyArrayList<T>)
        });
        return this;
    }
    
    // ------------------
    
}
