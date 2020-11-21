import { AbstractProperty } from "../properties/abstract-property";

export interface PropertyDependencyOptions {
    value?: boolean;
    validation?: boolean;
    visible?: boolean;
    required?: boolean;
}

export interface PropertyDependency {
    from: AbstractProperty;
    to: AbstractProperty;
    options: PropertyDependencyOptions;
}
