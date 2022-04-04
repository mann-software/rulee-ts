import { Provider } from "../provider";

export interface ValueProvider<T> extends Provider {
    /**
     * Get a value
     * If isAsynchronous() returns true, a promise is expected as result, otherwise no promise is expected
     */
    getValue(): Promise<T | null> | T | null; // TODO caching in provider and not in property scalar

    /**
     * Set the current value. Supported if not read-only
     * @param value new value
     */
    setValue(value: T | null): Promise<void> | void;
}
