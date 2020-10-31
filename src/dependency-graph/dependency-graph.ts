import { PropertyId } from "../properties/property-id";
import { AbstractProperty } from "../properties/abstract-property";
import { PropertyDependency, PropertyDependencyOptions } from "./property-dependency";
import { Logger } from "../util/logger/logger";
import { assertThat } from "../util/assertions/assertions";
import { ListOfPropertiesImpl } from "../properties/list-of-properties-impl";
import { GroupOfPropertiesImpl } from "../properties/group-of-properties-impl";

export type VisNodeGroup = 'scalar' | 'scalar-async' | 'group' | 'group-async' | 'list' | 'list-async';

export interface VisJsNode {
    id: number;
    label: string;
    group: VisNodeGroup;
}

export interface VisJsEdge {
    from: number;
    to: number;
    title?: string;
    dashes?: boolean | number[]; // true or sth like [5, 5, 3, 3]
    color?: string;
    arrows?: {
        to?: {
            enabled: boolean;
            type: string;
        };
        from?: {
            enabled: boolean;
            type: string;
        };
    };
}

/**
 * The rule engine will traverse all the direct and indirect dependencies of a property
 * if it has changed
 */
type OutgoingMap = Map<PropertyId, PropertyDependency>;
type EdgesMap = Map<PropertyId, OutgoingMap>;

/**
 * For async dependencies the rule engine needs to know which async processing needs to be done first.
 * An async dependency can also be indirectly connectly with sync dependencies. The map contains
 * the direct and indirect dependencies of async properties for every property
 */
type AsyncEdgesMap = Map<PropertyId, AbstractProperty<unknown>[]>;

export interface OwnerRelation {
    /**
     * Adds an owner dependency. That is the case if a property creates another poperty and manages it.
     * E.g. property list own its elements (properties), or select properties own its choice list properties
     *
     * An owning dependency makes sure that the ownedProperty is removed as well if the owner is removed
     * and the owner will be notified if the value of an owned property changes (if withValueDependency is not explicitly set to false)
     * 
     * @param owner property that ownes the other
     * @param ownedProperty property that is owned by owner porperty
     * @param withValueDependency add a value dependency from ownedProperty to owner? Default is true
     */
    addOwnerDependency(owner: AbstractProperty<unknown>, ownedProperty: AbstractProperty<unknown>, withValueDependency?: boolean): void;
}

export class DependencyGraph implements OwnerRelation {

    private readonly edgesMap: EdgesMap = new Map<string, OutgoingMap>();
    private readonly asyncEdgesMap: AsyncEdgesMap = new Map<string, AbstractProperty<unknown>[]>();
    private readonly ownerMap = new Map<PropertyId, PropertyId[]>();

    // --------

    addDependency(from: AbstractProperty<unknown>, to: AbstractProperty<unknown>, options: PropertyDependencyOptions) {
        Logger.trace(`${from.id} -> ${to.id}: ${Object.keys(options).join(', ')}`);
        let outgoing = this.edgesMap.get(from.id);
        if (!outgoing) {
            outgoing = new Map();
            this.edgesMap.set(from.id, outgoing);
        }
        const existing = outgoing.get(to.id);
        const mergedOptions = existing ? { ...existing.options, ...options } : options;
        outgoing.set(to.id, { from, to, options: mergedOptions });

        const asyncDeps = from.isAsynchronous() ? [from] : this.asyncEdgesMap.get(from.id);
        if (asyncDeps?.length) {
            // Due to the design of rule-definitions, the to-property will always have no dependents (except lists), yet
            // In case this breaks in future, recursively add 'asyncDeps' to all dependents of 'from' until
            // the the current dependent is asynchronous its self or it has no further dependents
            assertThat(
                () => !this.edgesMap.has(to.id) || to instanceof ListOfPropertiesImpl,
                () => `DependencyGraph: The property ${to.id} has no dependents, yet`
            );
            this.asyncEdgesMap.get(to.id)?.push(...asyncDeps) ?? this.asyncEdgesMap.set(to.id, asyncDeps);
        }
    }

    addDependencies(from: readonly AbstractProperty<unknown>[], to: AbstractProperty<unknown>, options: PropertyDependencyOptions) {
        from.forEach((prop: AbstractProperty<unknown>) => this.addDependency(prop, to, options)); // could be optimized by not using addDependency
    }

    addOwnerDependency(owner: AbstractProperty<unknown>, ownedProperty: AbstractProperty<unknown>, withValueDependency?: boolean): void {
        if (withValueDependency !== false) {
            this.addDependency(ownedProperty, owner, { value: true });
        }
        const owned = this.ownerMap.get(owner.id);
        if (owned) {
            owned.push(ownedProperty.id);
        } else {
            this.ownerMap.set(owner.id, [ownedProperty.id]);
        }
    }
    
    // --------

    traverseDepthFirst(start: PropertyId, apply: (prop: AbstractProperty<unknown>, dependency: PropertyDependency) => void, filter?: (dependency: PropertyDependency) => boolean, preventCycles?: boolean) {
        let visited: Set<PropertyId>;
        const outgoing = this.edgesMap.get(start);
        if (outgoing) {
            outgoing.forEach((dependency, to) => {
                if (!filter || filter(dependency)) {
                    if (preventCycles) {
                        if (!visited) {
                            visited = new Set();
                        }
                        if (!visited.has(dependency.to.id)) {
                            apply(dependency.to, dependency);
                            visited.add(dependency.to.id);
                            this.traverseDepthFirst(to, apply, filter);
                        }
                    } else {
                        apply(dependency.to, dependency);
                        this.traverseDepthFirst(to, apply, filter);
                    }
                }
            });
        }
    }

    getAsyncDependencies(propertyId: PropertyId) {
        return this.asyncEdgesMap.get(propertyId);
    }
    
    // --------

    /**
     * Checks for cyclic dependencies and returns the first cyclic path found.
     * Return null if there are no cyclic dependencies
     */
    findCyclicDependencies(): PropertyId[] | null {
        const visited = new Set<PropertyId>();
        for(const propId in this.edgesMap.keys()) {
            const cyclicPath = this.findCyclicDependenciesRecursive(propId, [], visited);
            if (cyclicPath) {
                return cyclicPath;
            }
        }
        return null;
    }

    private findCyclicDependenciesRecursive(current: PropertyId, path: PropertyId[], visited: Set<PropertyId>): PropertyId[] | null {
        if (visited.has(current)) {
            const currentIndex = path.indexOf(current);
            if (currentIndex >= 0) {
                const cylicPath = path.slice(currentIndex)
                cylicPath.push(current);
                return cylicPath;
            }
        } else {
            visited.add(current);
            path.push(current);
            const outgoing = this.edgesMap.get(current);
            outgoing?.forEach(dep => this.findCyclicDependenciesRecursive(dep.to.id, path, visited));
        }
        return null;
    }
    
    // --------

    /**
     * just wrap the result of this fcn in a vis.js DataSet
     */
    createVisJsData(allProperties: AbstractProperty<unknown>[]) {
        const nodes: VisJsNode[] = [];
        const edges: VisJsEdge[] = [];

        const propertyIdVisJsNodeMap = this.createVisJsNodes(allProperties, nodes);
        this.createVisJsEdges(propertyIdVisJsNodeMap, edges);

        const options = {
            nodes: {
                shape: "dot",
                size: 30,
                font: {
                    size: 15
                },
                borderWidth: 2,
                shadow: true
            },
            groups: { // colors: https://paletton.com/#uid=7481q0kqspsgswHlls7sSkxzhfw
                'scalar': {
                    color: { background: "#37278C", border: "black" }
                },
                'scalar-async': {
                    color: { background: "#4F419B", border: "black" }
                },
                'group': {
                    color: { background: "#40AC1E", border: "black" },
                    shape: "hexagon"
                },
                'group-async': {
                    color: { background: "#5EBE3F", border: "black" },
                    shape: "hexagon"
                },
                'list': {
                    color: { background: "#C12237", border: "black" },
                    shape: "square"
                },
                'list-async': {
                    color: { background: "#D5475B", border: "black" },
                    shape: "square"
                }
            },
            edges: {
                width: 2,
                shadow: true
            }
        };

        return { nodes, edges, options };
    }

    private createVisJsNodes(allProperties: AbstractProperty<unknown>[], nodes: VisJsNode[]) {
        const propertyIdVisJsNodeMap = new Map<PropertyId, VisJsNode>();
        allProperties.forEach((property: AbstractProperty<unknown>) => {
            const node: VisJsNode = {
                id: 1 + propertyIdVisJsNodeMap.size,
                label: property.id,
                group: this.propertyToVisNodeGroup(property)
            }
            nodes.push(node);
            propertyIdVisJsNodeMap.set(property.id, node);
        });
        return propertyIdVisJsNodeMap;
    }

    private propertyToVisNodeGroup(property: AbstractProperty<unknown>): VisNodeGroup {
        const isAsync = property.isAsynchronous();
        if (property instanceof ListOfPropertiesImpl) {
            return isAsync ? 'list-async' : 'list';
        }
        if (property instanceof GroupOfPropertiesImpl) {
            return isAsync ? 'group-async' : 'group';
        }
        return isAsync ? 'scalar-async' : 'scalar';
    }

    private createVisJsEdges(map: Map<PropertyId, VisJsNode>, edges: VisJsEdge[]) {
        this.edgesMap.forEach(outgoing => {
            outgoing.forEach(dependency => {
                const edge: VisJsEdge = {
                    from: map.get(dependency.from.id)!.id,
                    to: map.get(dependency.to.id)!.id,
                    dashes: !dependency.options.value,
                    title: Object.entries(dependency.options).filter(keyVal => !!keyVal[1]).map(keyVal => !keyVal[0]).join(', '),
                    arrows: {
                        to: {
                            enabled: true,
                            type: 'triangle'
                        }
                    }
                }
                edges.push(edge);
            })
        });
        this.ownerMap.forEach((toList, from) => {
            toList.forEach(to => {
                const edge: VisJsEdge = {
                    from: map.get(from)!.id,
                    to: map.get(to)!.id,
                    color: "rgb(110, 110, 110)",
                    arrows: {
                        from: {
                            enabled: true,
                            type: 'diamond'
                        }
                    }
                }
                edges.push(edge);
            });
        });
    }

}
