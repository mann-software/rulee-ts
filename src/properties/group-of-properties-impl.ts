import { PropertyGroup, GroupOfProperties, PropertyGroupData } from "./group-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler-impl";
import { AbstractDataProperty } from "./abstract-data-property";
import { AbstractProperty } from "./abstract-property";
import { AbstractParentPropertyImpl } from "./abstract-parent-property-impl";

/**
 * Manages an ordered set of properties
 */
export class GroupOfPropertiesImpl<T extends PropertyGroup> extends AbstractParentPropertyImpl<PropertyGroupData<T>> implements GroupOfProperties<T> {

    readonly propertiesAsList: AbstractDataProperty<unknown>[];

    constructor(
        readonly id: string,
        readonly properties: T,
        updateHandler: RuleEngineUpdateHandler
    ) {
        super(updateHandler);
        this.propertiesAsList = Object.keys(this.properties).map(propKey => this.properties[propKey]);
    }
    
    protected getChildren(): AbstractProperty[] {
        return this.propertiesAsList;
    }

    protected internallySyncUpdate(): void {
        throw new Error("Method not implemented.");
    }
    protected internallyAsyncUpdate<V>(): { asyncPromise: Promise<V>; resolve: (value: V) => void } {
        throw new Error("Method not implemented.");
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

    setToInitialState(): void {
        this.propertiesAsList.forEach(prop => prop.setToInitialState());
    }

    exportData(): PropertyGroupData<T> | null {
        return Object.keys(this.properties).reduce((res: {[key: string]: unknown}, cur: string) => {
            res[cur] = this.properties[cur].exportData();
            return res;
        }, {}) as PropertyGroupData<T>;
    }

    importData(data: PropertyGroupData<T> | null): void {
        if (data != null) {
            Object.keys(this.properties).forEach(key => {
                this.properties[key].importData(data[key]);
            });
        }
        this.needsAnUpdate();
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
