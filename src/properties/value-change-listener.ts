import { PropertyDependency } from "../dependency-graph/property-dependency";

export interface ValueChangeListener {
    needsAnUpdate?(): void;
    startsAsyncUpdate?(): void;
    updated(): void;
    dependencyHasBeenUpdated?(dependency: PropertyDependency): void;
    validated?(): void;
}
