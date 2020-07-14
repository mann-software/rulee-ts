import { BackpressureType } from "./backpressure-type";

export interface Backpressure {
    type: BackpressureType;
    debounceTime?: number;
}
