import { AbstractProperty } from "./abstract-property";
import { Choice } from "./choice";
import { PropertyArrayListReadonly } from "./property-array-list";
import { PropertyArrayListAsyncImpl } from "./property-array-list-impl";
import { PropertyScalar } from "./property-scalar";
import { PropertyScalarImpl } from "./property-scalar-impl";

export interface PropertyScalarWithChoices<T, V> extends PropertyScalar<T> {
    getChoices(): Choice<V>[];
    awaitChoices(): Promise<Choice<V>[]>;
}

export function isPropertyScalarWithChoices(property: AbstractProperty): property is PropertyScalarWithChoices<unknown, unknown>
{
    return property instanceof PropertyScalarImpl && "getChoices" in property;
}

export const upgradeAsPropertyWithChoices = <T, V, S extends PropertyArrayListReadonly<Choice<V>>>(propertyScalar: PropertyScalar<T>, choicesSource: (() => Choice<V>[]) | S) => {
    const upgradedProperty = propertyScalar as unknown as PropertyScalarWithChoices<T, V>;
    if (choicesSource instanceof Function) {
        upgradedProperty.getChoices = choicesSource;
        upgradedProperty.awaitChoices = () => Promise.resolve(choicesSource());
    } else {
        upgradedProperty.getChoices = () => choicesSource.getElements();
        if (choicesSource instanceof PropertyArrayListAsyncImpl) {
            upgradedProperty.awaitChoices = () => choicesSource.awaitElements().then(res => res ?? []);
            upgradedProperty.isProcessing = () => choicesSource.isProcessing();
        } else {
            upgradedProperty.awaitChoices = () => Promise.resolve(choicesSource.getElements());
        }
    }
    return upgradedProperty; 
};
