import { AbstractProperty } from "../properties/abstract-property";

export interface PropertyDependencyOptions {
    value?: boolean;
    validation?: boolean;
    visible?: boolean;
    mandatory?: boolean;
}

export interface PropertyDependency {
    from: AbstractProperty<any>;
    to: AbstractProperty<any>;
    options: PropertyDependencyOptions;
}
