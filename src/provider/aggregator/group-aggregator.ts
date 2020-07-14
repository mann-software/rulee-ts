
export interface GroupAggregator<T> {
    getValue(): Promise<T>;
}
