
export interface Choice<T> {
    value: T | null;
    // TODO isVisible(properties): boolean ??
    displayValue: string;
}
