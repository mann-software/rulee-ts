import { AbstractProperty } from "../properties/abstract-property";

export interface RuleEngineUpdateHandler<D> {
    /**
     * Call this, if the property might have changed.
     * The rule engine will mark all properties that are necessary to be updated
     * @param mightHaveChanged property that might have changed
     */
    needsAnUpdate(mightHaveChanged: AbstractProperty<D>): void;
    /**
     * Call this to let the rule engine handle the update.
     * The rule engine will call internallyUpdate on all properties that 
     * need to be updated
     * @param property to update
     */
    updateValue(property: AbstractProperty<D>): Promise<void>;
}
