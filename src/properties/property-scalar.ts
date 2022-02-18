import { AbstractDataProperty } from "./abstract-data-property";
import { AbstractProperty } from "./abstract-property";
import { PropertyScalarImpl } from "./property-scalar-impl";

export function isPropertyScalar(property: AbstractProperty): property is PropertyScalar<unknown>
{
    return property instanceof PropertyScalarImpl;
}

export interface PropertyScalar<D> extends AbstractDataProperty<D> {

    /**
     * Gets the initial value
     */
    getInitialValue(): D | null;

    /**
     * Calls getValue() and performs a conversion according to the used converter
     */
    getDisplayValue(): string;

    /**
     * Calls awaitValue() and performs a conversion according to the used converter
     */
    awaitDisplayValue(): Promise<string>;

    /**
     * Performs a conversion according to the used converter and then calls setValue(converted)
     * @param value display value
     */
    setDisplayValue(value: string | null): void;

    /**
     * Gets the current value but will not check if an update is needed.
     * For this to be done, awaitValue() needs to be called
     */
    getValue(): D | null;

    /**
     * Like getValue but returns the fallback value of the used converter if the
     * value is null.
     * 
     * Typically this 0 for numbers, '' for strings, false for boolean and
     * the current time for Date. For Choices its the empty choice if its value is not
     * null or else its the value of the first choice.
     */
    getNonNullValue(): D;

    /**
     * Triggers an update if the property needs an update and then
     * return the up-to-date value
     */
    awaitValue(): Promise<D | null>;

    /**
     * Sets the given value
     * @param value given value
     */
    setValue(value: D | null): void;

    isRequired(): boolean;
    isEmpty(): boolean;
    getInfoText(): string;
    getPlaceholder(): string;
}
