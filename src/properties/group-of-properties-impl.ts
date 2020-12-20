import { AbstractProperty } from "./abstract-property";
import { AbstractPropertyImpl } from "./abstract-property-impl";
import { PropertyGroup, GroupOfProperties, PropertyGroupData } from "./group-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { DataTypeOfProperty } from "./abstract-data-property";

/**
 * Manages an ordered set of properties
 */
export class GroupOfPropertiesImpl<T extends PropertyGroup> extends AbstractPropertyImpl<PropertyGroupData<T>> implements GroupOfProperties<T> {

    readonly propertiesAsList: readonly AbstractProperty[];

    constructor(
        readonly id: string,
        readonly properties: T,
        private readonly exportFcn: (props: T) => PropertyGroupData<T> | null,
        private readonly importFcn: (props: T, data: PropertyGroupData<T> | null) => void,
        updateHandler: RuleEngineUpdateHandler
    ) {
        super(updateHandler);
        this.propertiesAsList = Object.keys(this.properties).map(propKey => this.properties[propKey]);
    }

    protected internallySyncUpdate(): void {
        throw new Error("Method not implemented.");
    }
    protected internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void } {
        throw new Error("Method not implemented.");
    }

    protected getSpecialisedValidationResult() {
        return [];
    }

    isValid(): boolean {
        return super.isValid() && Object.keys(this.properties).every(k => this.properties[k].isValid());
    }

    isProcessing(): boolean {
        return Object.keys(this.properties).some(k => this.properties[k].isProcessing());
    }

    isReadOnly(): boolean {
        return Object.keys(this.properties).every(k => this.properties[k].isReadOnly());
    }

    isAsynchronous(): boolean {
        return Object.keys(this.properties).some(k => this.properties[k].isAsynchronous());
    }

    // ------------------
    // -- data relevant -
    // ------------------

    exportData(): PropertyGroupData<T> | null {
        return this.exportFcn(this.properties);
    }

    importData(data: PropertyGroupData<T> | null): void {
        this.importFcn(this.properties, data);
        this.needsAnUpdate();
    }

    compareData(a: PropertyGroupData<T> | null, b: PropertyGroupData<T> | null): boolean {
        return true; // TODO
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
