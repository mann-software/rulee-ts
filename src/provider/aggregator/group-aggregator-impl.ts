import { GroupAggregator } from "./group-aggregator";

export class GroupAggregatorImpl<T> implements GroupAggregator<T> {

    getValue(): Promise<T> {
        throw new Error("Method not implemented.");
    }
}
