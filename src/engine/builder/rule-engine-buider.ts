import { RuleEngine } from "../rule-engine";
import { PropertyId } from "../../properties/property-id";
import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { ValueConverter } from "../../value-converter/value-converter";
import { PropertyScalarRuleBinding } from "./property-scalar-rule-binding";
import { ValueProvider } from "../../provider/value-provider/value-provider";
import { DependencyGraph } from "../../dependency-graph/dependency-graph";
import { AbstractPropertyWithInternals } from "../../properties/abstract-property-impl";
import { PropertyScalarBuilder } from "./property-scalar-builder";
import { TriggerBuilder } from "./trigger-builder";
import { GroupOfPropertiesBuilder } from "./group-of-properties-builder";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { RuleEngineBuilderOptions } from "./rule-engine-builder-options";
import { ScalarValidator } from "../../validators/validator";
import { V } from "../../validators/common-validators";
import { EmptyValueFcn } from "../../provider/value-provider/empty-value-fcn";
import { AttributeId } from "../../attributes/attribute-id";

export class RuleEngineBuilder {

    private readonly propertyMap: { [id: string]: AbstractPropertyWithInternals<unknown> } = {};
    private readonly dependencyGraph = new DependencyGraph();
    private readonly ruleEngine = new RuleEngine(this.dependencyGraph, this.propertyMap);

    private get properties() {
        return Object.values(this.propertyMap);
    }
    
    private readonly notEmptyIfRequiredValidator: ScalarValidator<unknown>;

    private readonly propertyScalarBuilder = new PropertyScalarBuilder(
        <T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: AbstractProperty<unknown>[], initialValue?: T | null) =>
            this.propertyScalar(id, provider, emptyValueFcn, converter, dependencies, initialValue),
        <T>(prop: PropertyScalar<T>) => this.bindPropertyScalar(prop)
    );

    get scalar() {
        return this.propertyScalarBuilder;
    }

    private readonly groupOfPropertiesBuilder = new GroupOfPropertiesBuilder(
        <T extends { [id: string]: AbstractProperty<unknown> }, D>(id: string, properties: T, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void) =>
            this.groupOfProperties(id, properties, exportFcn, importFcn)
    );

    get group() {
        return this.groupOfPropertiesBuilder;
    }

    private readonly triggerBuilder = new TriggerBuilder();

    get trigger() {
        return this.triggerBuilder;
    }

    constructor(options: RuleEngineBuilderOptions) {
        this.notEmptyIfRequiredValidator = options.emptyButRequiredMessage instanceof Function 
            ? V.notEmptyMsgProvider(options.emptyButRequiredMessage)
            : V.notEmpty(options.emptyButRequiredMessage);
    }

    private propertyScalar<T>(id: PropertyId,provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: AbstractProperty<unknown>[], initialValue?: T | null): PropertyScalarImpl<T> {
        const prop = new PropertyScalarImpl(id, provider, emptyValueFcn, converter, this.ruleEngine);
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        if (initialValue !== undefined) {
            prop.defineInitialValue(initialValue);
        }
        return prop;
    }

    private bindPropertyScalar<T>(prop: PropertyScalar<T>): PropertyScalarRuleBinding<T> {
        return new PropertyScalarRuleBinding<T>(
            prop,
            this.notEmptyIfRequiredValidator,
            (from: AbstractProperty<unknown>[], to: AbstractProperty<T>, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options)
        );
    }

    private groupOfProperties<T extends { [id: string]: AbstractProperty<unknown> }, D>(id: string, properties: T, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void) {
        const prop = new GroupOfPropertiesImpl(id, properties, exportFcn, importFcn, this.ruleEngine);
        this.addProperty(prop);
        this.addDependencies(this.dependencyGraph, prop.propertiesAsList(), prop, { value: true });
        return prop;
    }

    private addDependencies(dependencyGraph: DependencyGraph, from: AbstractProperty<unknown>[], to: AbstractProperty<unknown>, options: PropertyDependencyOptions) {
        if (from.length) {
            dependencyGraph.addDependencies(from, to, options);
        }
    }

    private addProperty(property: AbstractPropertyWithInternals<unknown>) {
        if (this.propertyMap[property.id]) {
            throw new Error(`A Property with the id ${property.id} is already defined`);
        }
        this.propertyMap[property.id] = property;
    }

    defineCustomAttribute<A>(name: string): AttributeId<A> {
        return { name };
    }

    initialise() {
        this.dependencyGraph.analyse();
        this.properties.forEach(prop => prop.internallyInit())
        return this.ruleEngine;
    }

    asVisJsDataLink() {
        return this.dependencyGraph.createVisJsData(this.properties);
    }

    generateNetworkGraphHtmlPage() {
        const graph = this.asVisJsDataLink();
        const nodes = JSON.stringify(graph.nodes);
        const edges = JSON.stringify(graph.edges);
        const options = JSON.stringify(graph.options);
        return `<!DOCTYPE HTML>
<html>
<head>
    <script src="https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        #network {
            position: absolute; top: 0; right: 0; bottom: 0; left: 0;
        }
    </style>
</head>
<body>
    <div id="network"></div>
    <script type="text/javascript">
        var container = document.getElementById("network");
        var data = {
            nodes: new vis.DataSet(${nodes}),
            edges: new vis.DataSet(${edges}),
        };
        var options = ${options};
        var network = new vis.Network(container, data, options);
    </script> 
</body>
</html>`
    }

    generateFactory(): string {
        // const engine = this.initialise();
        // const serialized = RuleEngine.serialize(engine);
        // TODO generate rule-engine-factory.ts with serialzed rule engine internally
        return '';
    }
}
