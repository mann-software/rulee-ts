import { Choice } from "./choice";
import { PropertyScalar } from "./property-scalar";

export interface PropertyScalarWithChoices<T, V> extends PropertyScalar<T> {
    getChoices(): Choice<V>[];
}

export const upgradeAsPropertyWithChoices = <T, V>(propertyScalar: PropertyScalar<T>, choicesFcn: () => Choice<V>[]) => {
    (propertyScalar as unknown as PropertyScalarWithChoices<T, V>).getChoices = choicesFcn;
    return propertyScalar as unknown as PropertyScalarWithChoices<T, V>; 
};
