
export interface ValueProvider<T> {
    /**
     * Get a value
     * If isAsynchronous() returns true, a promise is expected as result, otherwise no promise is expected
     */
    getValue(): Promise<T | null> | T | null;

    /**
     * Set the current value. Supported if not read-only
     * @param value new value
     */
    setValue(value: T | null): void;

    /**
     * Indicates that geting the value requires asynchronous processing.
     */
    isAsynchronous(): boolean;
    /**
     * Indicates that the value is currently asynchronously processed
     */
    isProcessing(): boolean;
    /**
     * Indicates, that the value should be cached or needs to be/better be recomputed every time.
     * If set to true, the value is fetched only after a dependency has changed.
     * If set to false, the value is fetched on every request.
     */
    shouldBeCached(): boolean;
    /**
     * Indicates that setting a value is not allowed
     */
    isReadOnly(): boolean;
}
