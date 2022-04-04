
export interface Provider {
    /**
     * Indicates that geting the value requires asynchronous processing.
     */
    isAsynchronous(): boolean;
    /**
     * Indicates that the value is currently asynchronously processed
     */
    isProcessing(): boolean;
    /**
     * Cancel ongoing processings if there are any
     */
    setDataToInitialState(): void;
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
