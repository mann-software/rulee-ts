import { Choice } from "./choice";
import { PropertyScalar } from "./property-scalar";

export interface PropertyScalarWithChoices<T, V> extends PropertyScalar<T> {
    getChoices(): Choice<V>[];
    awaitChoices(): Promise<Choice<V>[]>;
}

export const upgradeAsPropertyWithChoices = <T, V>(propertyScalar: PropertyScalar<T>, choicesSource: (() => Choice<V>[]) | PropertyScalar<Choice<V>[]>) => {
    const upgradedProperty = propertyScalar as unknown as PropertyScalarWithChoices<T, V>;
    if (choicesSource instanceof Function) {
        upgradedProperty.getChoices = choicesSource;
        upgradedProperty.awaitChoices = () => Promise.resolve(choicesSource());
    } else {
        upgradedProperty.getChoices = () => choicesSource.getNonNullValue();
        upgradedProperty.awaitChoices = () => choicesSource.awaitValue().then(res => res ?? []);
        upgradedProperty.isProcessing = () => choicesSource.isProcessing();
    }
    return upgradedProperty; 
};
