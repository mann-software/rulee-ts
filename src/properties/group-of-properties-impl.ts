import { AbstractProperty } from "./abstract-property";
import { AbstractPropertyImpl } from "./abstract-property-internals";
import { GroupOfProperties } from "./group-of-properties";
import { RuleEngineUpdateHandler } from "../engine/rule-engine-update-handler";

/**
 * Manages an ordered set of properties
 */
export class GroupOfPropertiesImpl<T extends { [id: string]: AbstractProperty<unknown> }, D> extends AbstractPropertyImpl<D> implements GroupOfProperties<T, D> {

    constructor(
        readonly id: string,
        readonly properties: T,
        private readonly exportFcn: (props: T) => D | null,
        private readonly importFcn: (props: T, data: D | null) => void,
        updateHandler: RuleEngineUpdateHandler<D>
    ) {
        super(updateHandler);
    }

    propertiesAsList(): AbstractProperty<unknown>[] {
        return Object.keys(this.properties).map(propKey => this.properties[propKey]);
    }

    internallyInit() {
        // TODO
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

    exportData(): D | null {
        return this.exportFcn(this.properties);
    }

    importData(data: D | null): void {
        this.importFcn(this.properties, data);
        this.needsAnUpdate();
    }

    compareData(a: D | null, b: D | null): boolean {
        return true; // TODO
    }
    
    // ------------------
    // -- data relevant: end
    // ------------------
}
