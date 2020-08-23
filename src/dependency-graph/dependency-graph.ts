import { PropertyId } from "../properties/property-id";
import { AbstractProperty } from "../properties/abstract-property";
import { PropertyDependency, PropertyDependencyOptions } from "./property-dependency";
import { Logger } from "../util/logger/logger";

export type VisNodeGroup = 'default' | 'async' | 'readonly' | 'async-readonly';

export interface VisJsNode {
    id: number;
    label: string;
    group: VisNodeGroup;
}

export interface VisJsEdge {
    from: number;
    to: number;
    title: string;
    dashes?: boolean | number[]; // true or sth like [5, 5, 3, 3]
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

export class DependencyGraph {

    private readonly edgesMap: EdgesMap = new Map<string, OutgoingMap>();
    private readonly asyncEdgesMap: AsyncEdgesMap = new Map<string, AbstractProperty<unknown>[]>();

    // --------

    addDependency(from: AbstractProperty<unknown>, to: AbstractProperty<unknown>, options: PropertyDependencyOptions) {
        Logger.debug(`${from.id} -> ${to.id}: ${Object.keys(options).join(', ')}`);
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
            this.traverseDepthFirst(from.id, prop => {
                if (!this.asyncEdgesMap.has(prop.id)) {
                    this.asyncEdgesMap.set(prop.id, asyncDeps);
                } else {
                    this.asyncEdgesMap.get(prop.id)?.push(...asyncDeps);
                }
            }, dep => !dep.from.isAsynchronous() || dep.from.id === from.id);
        }
    }

    addDependencies(from: AbstractProperty<unknown>[], to: AbstractProperty<unknown>, options: PropertyDependencyOptions) {
        from.forEach((prop: AbstractProperty<unknown>) => this.addDependency(prop, to, options)); // could be optimized by not using addDependency
    }

    addDependents(from: AbstractProperty<unknown>, to: AbstractProperty<unknown>[], options: PropertyDependencyOptions) {
        to.forEach((prop: AbstractProperty<unknown>) => this.addDependency(from, prop, options)); // could be optimized by not using addDependency
    }
    
    // --------

    traverseDepthFirst(start: PropertyId, apply: (prop: AbstractProperty<unknown>, dependency: PropertyDependency) => void, filter?: (dependency: PropertyDependency) => boolean) {
        const outgoing = this.edgesMap.get(start);
        if (outgoing) {
            outgoing.forEach((dependency, to) => {
                if (!filter || filter(dependency)) {
                    apply(dependency.to, dependency);
                    this.traverseDepthFirst(to, apply, filter);
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
            groups: {
                'default': {
                    color: { background: "rgb(0,204,52)", border: "black" }
                },
                'async': {
                    color: { background: "rgb(204,0,153)", border: "black" }
                },
                'async-readonly': {
                    color: { background: "rgb(204,0,153)", border: "black" },
                    shape: "hexagon"
                },
                'readonly': {
                    color: { background: "rgb(0,204,52)", border: "black" },
                    shape: "hexagon"
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
        if (property.isAsynchronous()) {
            if (property.isReadOnly()) {
                return 'async-readonly';
            } else {
                return 'async'
            }
        } else if (property.isReadOnly()) {
            return 'readonly';
        }
        return 'default';
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
                            type: 'arrow'
                        }
                    }
                }
                edges.push(edge);
            })
        });
    }

}
