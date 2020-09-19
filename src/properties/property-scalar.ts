import { AbstractProperty } from "./abstract-property";
import { AttributeId } from "../attributes/attribute-id";
import { Choice } from "./choice";

export interface PropertyScalar<T> extends AbstractProperty<T> {
    /**
     * (Re)sets the value to the defined initial value
     */
    setToInitialValue(): void;
    /**
     * Gets the initial value
     */
    getInitialValue(): T | null;
    /**
     * Performs a conversion on getValue() according to the used converter
     */
    getDisplayValue(): string;
    setDisplayValue(value: string | null): void;
    awaitDisplayValue(): Promise<string>;
    /**
     * Like getValue but returns the fallback value of the used converter if the
     * value is null.
     * 
     * Typically this 0 for numbers, '' for strings, false for boolean and
     * the current time for Date. For Choices its the empty choice if its value is not
     * null or else its the value of the first choice.
     */
    getNonNullValue(): T;
    /**
     * Gets the current value
     */
    getValue(): T | null;
    setValue(value: T | null): void;
    /**
     * Triggers an update if the property needs an update and then
     * return the up-to-date value
     */
    awaitValue(): Promise<T | null>;
    /**
     * Returns the choices if they were defined
     */
    getChoices(): Choice<T>[] | undefined;
    get<A>(id: AttributeId<A>): A | undefined;
    isRequired(): boolean;
    isVisible(): boolean;
    isEmpty(): boolean;
    getLabel(): string;
    getInfoText(): string;
    getPlaceholder(): string;
}
