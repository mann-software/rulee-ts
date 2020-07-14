
export interface ValueConverter<T> {
    fromDisplayValue(value: string | null): T | null;
    asDisplayValue(value: T | null): string;
}
