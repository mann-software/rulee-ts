import { PropertyId } from "../../properties/property-id";
import { PropertyScalar } from "../../properties/property-scalar";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { ValueConverter } from "../../value-converter/value-converter";
import { PropertyScalarRuleBuilder } from "./property-scalar-rule-builder";
import { ValueProvider } from "../../provider/value-provider/value-provider";
import { DependencyGraph } from "../../dependency-graph/dependency-graph";
import { AbstractPropertyWithInternals } from "../../properties/abstract-property-impl";
import { PropertyScalarBuilder } from "./property-scalar-builder";
import { TriggerBuilder } from "./trigger-builder";
import { GroupOfPropertiesBuilder } from "./group-of-properties-builder";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { BuilderOptions } from "./builder-options";
import { PropertyScalarValidator } from "../../validators/property-validator";
import { V } from "../../validators/common/common-validators";
import { EmptyValueFcn } from "../../provider/empty-value-fcn";
import { AttributeId } from "../../attributes/attribute-id";
import { BackpressureConfig } from "../../properties/backpressure/backpressure-config";
import { ListBuilder, SelectionMode } from "./list-builder";
import { ListOfPropertiesImpl } from "../../properties/list-of-properties-impl";
import { CrossValidator } from "../../validators/cross-validator";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { GroupOfProperties, PropertyGroup } from "../../properties/group-of-properties";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { ListIndex } from "../../properties/lists/index/list-index";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { AsyncListProvider, ListProvider } from "../../provider/list-provider/list-provider";
import { PropertyArrayListAsyncImpl, PropertyArrayListSyncImpl } from "../../properties/property-array-list-impl";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { RuleEngineImpl } from "../rule-engine-impl";
import { GroupOfPropertiesRuleBuilder } from "./group-of-properties-rule-builder";
import { ListOfProperties, PropertyArrayList } from "../../index";
import { ListOfPropertiesRuleBuilder } from "./list-of-properties-rule-builder";
import { PropertyArrayListRuleBuilder } from "./property-array-list-rule-builder";

export class Builder {

    private get properties() {
        return Object.values(this.propertyMap);
    }
    
    private readonly notEmptyIfRequiredValidator: PropertyScalarValidator<unknown, []>;
    private readonly defaultEmptyChoiceDisplayValue: string | undefined;
    private readonly defaultBackpressureConfig: BackpressureConfig;
    private readonly textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn };

    readonly scalar: PropertyScalarBuilder;
    readonly group: GroupOfPropertiesBuilder;
    readonly trigger = new TriggerBuilder();
    readonly list: ListBuilder;

    constructor(
        options: BuilderOptions,
        private readonly ruleEngine: RuleEngineImpl,
        private readonly dependencyGraph: DependencyGraph,
        private readonly propertyMap: { [id: string]: AbstractPropertyWithInternals<unknown> }
    ) {
        this.notEmptyIfRequiredValidator = options.emptyButRequiredMessage instanceof Function 
            ? V.scalar.notEmptyMsgProvider(options.emptyButRequiredMessage)
            : V.scalar.notEmpty(options.emptyButRequiredMessage);

        if (options.defaultEmptyChoiceDisplayValue) {
            this.defaultEmptyChoiceDisplayValue = options.defaultEmptyChoiceDisplayValue;
        }
        this.defaultBackpressureConfig = Object.freeze(options.defaultBackpressureConfig ?? { 
            type: "switch",
            debounceTime: 40
        });
        this.textInterpreters = {
            [TextInterpreter.Html]: options.textInterpreterHtml,
            [TextInterpreter.Markdown]: options.textInterpreterMarkdown,
            [TextInterpreter.Custom]: options.textInterpreterCustom,
        };

        this.list =  new ListBuilder(
            <T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, config?: { selectionMode?: SelectionMode }) =>
                this.listOfProperties<T, D>(id, itemTemplate, config),
            <T>(id: PropertyId, provider: ListProvider<T>, dependencies?: readonly AbstractProperty[]) =>
                this.propertyList(id, provider, dependencies),
            <T>(id: PropertyId, provider: AsyncListProvider<T>, dependencies?: readonly AbstractProperty[], propertyConfig?: { backpressure?: BackpressureConfig }) =>
                this.asyncPropertyList(id, provider, dependencies, propertyConfig),
            <T extends AbstractDataProperty<D>, D>(prop: ListOfProperties<T, D>) => this.bindListOfProperties(prop),
            <T>(prop: PropertyArrayList<T>) => this.bindPropertyArrayList(prop),
        );
        this.group = new GroupOfPropertiesBuilder(
            <T extends PropertyGroup>(id: string, properties: T) => this.groupOfProperties(id, properties),
            <T extends PropertyGroup>(prop: GroupOfProperties<T>) => this.bindGroupOfProperties(prop),
        );
        this.scalar = new PropertyScalarBuilder(
            <T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: readonly AbstractProperty[], propertyConfig?: { backpressure?: BackpressureConfig }, ownedProperties?: readonly AbstractProperty[]) =>
                this.propertyScalar(id, provider, emptyValueFcn, converter, dependencies, propertyConfig, ownedProperties),
            <T>(prop: PropertyScalar<T>) => this.bindPropertyScalar(prop),
            this.defaultEmptyChoiceDisplayValue,
            this.list,
        );
    }

    // -------------------------------------------------

    private propertyScalar<T>(id: PropertyId, provider: ValueProvider<T>, emptyValueFcn: EmptyValueFcn<T>, converter: ValueConverter<T>, dependencies?: readonly AbstractProperty[], config?: { backpressure?: BackpressureConfig }, ownedProperties?: readonly AbstractProperty[]): PropertyScalarImpl<T> {
        const prop = new PropertyScalarImpl(id, provider, emptyValueFcn, converter, this.ruleEngine, config?.backpressure ?? (provider.isAsynchronous() ? this.defaultBackpressureConfig : undefined));
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        if (ownedProperties) {
            ownedProperties.forEach(owned => this.dependencyGraph.addOwnerDependency(prop, owned, false));
        }
        return prop;
    }

    private bindPropertyScalar<T>(prop: PropertyScalar<T>): PropertyScalarRuleBuilder<T> {
        return new PropertyScalarRuleBuilder<T>(
            prop,
            this.notEmptyIfRequiredValidator,
            (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options),
            this.textInterpreters,
        );
    }

    // -------------------------------------------------

    private groupOfProperties<T extends PropertyGroup>(id: string, properties: T) {
        const prop = new GroupOfPropertiesImpl(id, properties, this.ruleEngine);
        this.addProperty(prop);
        this.addDependencies(this.dependencyGraph, prop.propertiesAsList, prop, { value: true });
        return prop;
    }

    private bindGroupOfProperties<T extends PropertyGroup>(prop: GroupOfProperties<T>): GroupOfPropertiesRuleBuilder<T> {
        return new GroupOfPropertiesRuleBuilder<T>(
            prop,
            (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options),
        );
    }

    // -------------------------------------------------

    private listOfProperties<T extends AbstractDataProperty<D>, D>(id: string, itemTemplate: PropertyTemplate<T, D>, config?: { selectionMode?: SelectionMode }): ListOfPropertiesImpl<T, D> {
        const isMultiSelect = config?.selectionMode === SelectionMode.MultiSelect;
        const prop = new ListOfPropertiesImpl<T, D>(id, itemTemplate, isMultiSelect, this.ruleEngine, this.dependencyGraph);
        this.addProperty(prop);
        return prop;
    }

    private bindListOfProperties<T extends AbstractDataProperty<D>, D>(prop: ListOfProperties<T, D>): ListOfPropertiesRuleBuilder<T, D> {
        return new ListOfPropertiesRuleBuilder<T, D>(
            prop,
            (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options),
        );
    }

    // -------------------------------------------------

    private propertyList<T>(id: PropertyId, provider: ListProvider<T>, dependencies?: readonly AbstractProperty[]): PropertyArrayListSyncImpl<T> {
        const prop = new PropertyArrayListSyncImpl(id, provider, this.ruleEngine, undefined);
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        return prop;
    }

    private asyncPropertyList<T>(id: PropertyId, provider: AsyncListProvider<T>, dependencies?: readonly AbstractProperty[], config?: { backpressure?: BackpressureConfig }): PropertyArrayListAsyncImpl<T> {
        const prop = new PropertyArrayListAsyncImpl(id, provider, this.ruleEngine, config?.backpressure);
        this.addProperty(prop);
        if (dependencies) {
            this.addDependencies(this.dependencyGraph, dependencies, prop, { value: true });
        }
        return prop;
    }

    private bindPropertyArrayList<T>(prop: PropertyArrayList<T>): PropertyArrayListRuleBuilder<T> {
        return new PropertyArrayListRuleBuilder<T>(
            prop,
            (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => this.addDependencies(this.dependencyGraph, from, to, options),
        );
    }

    // -------------------------------------------------

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

    addCrossValidator<Properties extends readonly AbstractProperty[]>(...validatedProperties: Properties): (validator: CrossValidator<Properties>) => void {
        return (validator: CrossValidator<Properties>) => {
            const instance: ValidatorInstance<Properties> = {
                validationArguments: validatedProperties,
                validate: validator
            };
            validatedProperties.forEach((prop, i) => {
                (prop as AbstractPropertyWithInternals<unknown>).addValidator(instance);
                for (let j = i +1; j < validatedProperties.length; j++) {
                    const dependent = validatedProperties[j];
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
}
