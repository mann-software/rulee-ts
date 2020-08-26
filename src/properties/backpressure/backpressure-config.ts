import { BackpressureType } from "./backpressure-type";

export interface BackpressureConfig {
    type: BackpressureType;
    debounceTime?: number;
}
