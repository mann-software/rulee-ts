
/**
 * Converts the actual value that the ValueProvider provides
 */
export interface ValueConverter<T> {
    /**
     * Converts the display value to an actual value according to
     * the type of the property
     * @param value display value
     */
    fromDisplayValue(value: string | null): T | null;
    /**
     * Converts the actual value to a representation 
     * that can be used to display
     * @param value actual value
     */
    asDisplayValue(value: T | null): string;
    /**
     * Defines a fallback value in case the actual value
     * of the property is null
     */
    getNullFallbackValue(): T;
}
