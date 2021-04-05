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
import { PropertyScalarBuilder, PropertyScalarValueConfig } from "./property-scalar-builder";
import { TriggerBuilder } from "./trigger-builder";
import { GroupOfPropertiesBuilder } from "./group-of-properties-builder";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { BuilderOptions, PropertyConfig } from "./builder-options";
import { SinglePropertyValidator } from "../../validators/single-property-validator";
import { V } from "../../validators/common/common-validators";
import { EmptyValueFcn } from "../../provider/empty-value-fcn";
import { AttributeId } from "../../attributes/attribute-id";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { Choice } from "../../properties/choice";
import { ListBuilder } from "./list-builder";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { Validator } from "../../validators/validator";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { PropertyGroup } from "../../properties/group-of-properties";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { ListIndex } from "../../properties/lists/index/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { AsyncListProvider, ListProvider } from "../../provider/list-provider/list-provider";
import { PropertyArrayListAsyncImpl, PropertyArrayListSyncImpl } from "../../properties/property-array-list-impl";

export class Builder {

    private get properties() {
        return Object.values(this.propertyMap);
    }
    
    private readonly notEmptyIfRequiredValidator: SinglePropertyValidator<PropertyScalar<unknown>>;
    private readonly defaultEmptyChoice: Choice<any> | undefined;
    private readonly defaultBackpressureConfig: BackpressureConfig;

    readonly scalar: PropertyScalarBuilder;
    readonly group: GroupOfPropertiesBuilder;
    readonly trigger = new TriggerBuilder();
    readonly list: ListBuilder;

    constructor(
        options: BuilderOptions,
        private readonly ruleEngine: RuleEngine,
        private readonly dependencyGraph: DependencyGraph,
        private readonly propertyMap: { [id: string]: AbstractPropertyWithInternals<unknown> }
    ) {
        this.notEmptyIfRequiredValidator = options.emptyButRequiredMessage instanceof Function 
            ? V.notEmptyMsgProvider(options.emptyButRequiredMessage)
            : V.notEmpty(options.emptyButRequiredMessage);

        this.defaultBackpressureConfig = Object.freeze(options.defaultBackpressureConfig ?? { 
            type: "switch",
            debounceTime: 40
        });
        if (options.defaultEmptyChoiceDisplayValue) {
            this.defaultEmptyChoice = {
                value: null,
                displayValue: options.defaultEmptyChoiceDisplayValue
            };
        }
        this.list =  new ListBuilder(
            <T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, isMultiSelect: boolean) =>
                this.listOfProperties<T, D>(id, itemTemplate, isMultiSelect),
            <T>(id: PropertyId, provider: ListProvider<T>, dependencies?: readonly AbstractProperty[], propertyConfig?: PropertyConfig & { backpressure?: BackpressureConfig }) =>
                this.propertyList(id, provider, dependencies, propertyConfig),
            <T>(id: PropertyId, provider: AsyncListProvider<T>, dependencies?: readonly AbstractProperty[], propertyConfig?: PropertyConfig & { backpressure?: BackpressureConfig }) =>
                this.asyncPropertyList(id, provider, dependencies, propertyConfig),
        );
        this.group = new GroupOfPropertiesBuilder(
            <T extends PropertyGroup>(id: string, properties: T) => this.groupOfProperties(id, properties)
        );
        this.scalar = new PropertyScalarBuilder(
            <T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: readonly AbstractProperty[], propertyConfig?: PropertyConfig & PropertyScalarValueConfig<T> & { backpressure?: BackpressureConfig }, ownedProperties?: readonly AbstractProperty[]) =>
                this.propertyScalar(id, provider, emptyValueFcn, converter, dependencies, propertyConfig, ownedProperties),
            <T>(prop: PropertyScalar<T>) => this.bindPropertyScalar(prop),
            this.defaultEmptyChoice,
            this.list,
        );
    }

    private propertyScalar<T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: readonly AbstractProperty[], config?: PropertyConfig & PropertyScalarValueConfig<T> & { backpressure?: BackpressureConfig }, ownedProperties?: readonly AbstractProperty[]): PropertyScalarImpl<T> {
        const prop = new PropertyScalarImpl(id, provider, emptyValueFcn, converter, this.ruleEngine, config?.backpressure ?? (provider.isAsynchronous() ? this.defaultBackpressureConfig : undefined));
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        if (ownedProperties) {
            ownedProperties.forEach(owned => this.dependencyGraph.addOwnerDependency(prop, owned, false));
        }
        if (config) {
            if (config.initialValue !== undefined) {
                prop.defineInitialValue(config.initialValue);
            }
            if (config.labelAndPlaceholder !== undefined) {
                prop.defineLabel(config.labelAndPlaceholder);
                prop.definePlaceholder(config.labelAndPlaceholder);
            }
            if (config.label !== undefined) {
                prop.defineLabel(config.label);
            }
            if (config.placeholder !== undefined) {
                prop.definePlaceholder(config.placeholder);
            }
        }
        prop.setToInitialState();
        return prop;
    }

    private bindPropertyScalar<T>(prop: PropertyScalar<T>): PropertyScalarRuleBinding<T> {
        return new PropertyScalarRuleBinding<T>(
            prop,
            this.notEmptyIfRequiredValidator,
            (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options)
        );
    }

    private groupOfProperties<T extends PropertyGroup>(id: string, properties: T) {
        const prop = new GroupOfPropertiesImpl(id, properties, this.ruleEngine);
        this.addProperty(prop);
        this.addDependencies(this.dependencyGraph, prop.propertiesAsList, prop, { value: true });
        return prop;
    }

    private listOfProperties<T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, isMultiSelect: boolean, ): ListOfPropertiesImpl<T, D> {
        const prop = new ListOfPropertiesImpl<T, D>(id, itemTemplate, isMultiSelect, this.ruleEngine, this.dependencyGraph);
        this.addProperty(prop);
        return prop;
    }

    private propertyList<T>(id: PropertyId, provider: ListProvider<T>, dependencies?: readonly AbstractProperty[], config?: PropertyConfig & { backpressure?: BackpressureConfig }): PropertyArrayListSyncImpl<T> {
        const prop = new PropertyArrayListSyncImpl(id, provider, this.ruleEngine, config?.backpressure);
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        // TODO config values  
        return prop;
    }

    private asyncPropertyList<T>(id: PropertyId, provider: AsyncListProvider<T>, dependencies?: readonly AbstractProperty[], config?: PropertyConfig & { backpressure?: BackpressureConfig }): PropertyArrayListAsyncImpl<T> {
        const prop = new PropertyArrayListAsyncImpl(id, provider, this.ruleEngine, config?.backpressure);
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        // TODO config values   
        return prop;
    }

    private addDependencies(dependencyGraph: DependencyGraph, from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) {
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

    bindValidator<Properties extends readonly AbstractProperty[]>(...properties: Properties): (validator: Validator<Properties>) => void {
        return (validator: Validator<Properties>) => {
            const instance: ValidatorInstance<Properties> = {
                getValidatedProperties: () => properties,
                validate: validator
            };
            properties.forEach((prop, i) => {
                (prop as AbstractPropertyWithInternals<unknown>).addValidator(instance);
                for (let j = i +1; j < properties.length; j++) {
                    const dependent = properties[j];
                    this.dependencyGraph.addDependency(prop, dependent, { validation: true });
                    this.dependencyGraph.addDependency(dependent, prop, { validation: true });
                }
            });
        };
    }

    decorateTemplate<T extends AbstractDataProperty<D>, D>(template: PropertyTemplate<T, D>, decorator: (property: T) => void): PropertyTemplate<T, D> {
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<T>) => {
            const property = template(id, index, siblingAccess);
            decorator(property);
            return property;
        };
    }

    asVisJsData() {
        return this.dependencyGraph.createVisJsData(this.properties);
    }

    generateNetworkGraphHtmlPage() {
        const graph = this.asVisJsData();
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
