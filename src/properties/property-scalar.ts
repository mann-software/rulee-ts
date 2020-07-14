import { AbstractProperty } from "./abstract-property";
import { ValidationMessage } from "../validators/validation-message";
import { AttributeId } from "../attributes/attribute-id";

export interface PropertyScalar<T> extends AbstractProperty<T> {
    setToInitialValue(): void;
    getDisplayValue(): string;
    setDisplayValue(value: string | null): void;
    awaitDisplayValue(): Promise<string>;
    getValue(): T | null;
    setValue(value: T | null): void;
    awaitValue(): Promise<T | null>;
    get<A>(id: AttributeId<A>): A | undefined;
    isMandatory(): boolean;
    isVisible(): boolean;
    isEmpty(): boolean;
    getLabel(): string;
    getInfoText(): string;
    getPlaceholder(): string;
}
