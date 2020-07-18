import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/factory/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";

const defaultExportFcn = <T extends { [id: string]: AbstractProperty<unknown> }>(props: T) =>
    Object.keys(props).reduce((res: {[key: string]: unknown}, cur: string) => {
        res[cur] = props[cur].exportData();
        return res;
    }, {});

const defaultImportFcn = <T extends { [id: string]: AbstractProperty<unknown> }>(props: T, data: { [id: string]: any } | null) => 
    data instanceof Object && Object.keys(props).forEach(key => {
        props[key].importData(data[key]);
    });

export class GroupOfPropertiesBuilder {

    constructor(
        private readonly propertyGroup: <T extends { [id: string]: AbstractProperty<unknown> }, D>(id: string, properties: T, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void) => GroupOfPropertiesImpl<T, D>
    ) { }

    createTemplate<T extends { [id: string]: AbstractProperty<unknown> }>(propertiesOfGroup: (prefix: string, index?: ListIndex) => T): PropertyTemplate<GroupOfProperties<T, { [id: string]: unknown }>, { [id: string]: unknown }>
    createTemplate<T extends { [id: string]: AbstractProperty<unknown> }, D>(propertiesOfGroup: (prefix: string, index?: ListIndex) => T, optional?: { exportFcn?: (props: T) => D | null; importFcn?: (props: T, data: D | null) => void }): PropertyTemplate<GroupOfProperties<T, D>, D> {
        const processOptional = this.processOptional(optional);
        return (id: string, index?: ListIndex) => this.propertyGroup(id, propertiesOfGroup(id, index), processOptional.exportFcn, processOptional.importFcn);
    }

    of<T extends { [id: string]: AbstractProperty<unknown> }>(id: string, propertiesOfGroup: T): GroupOfProperties<T, { [id: string]: unknown }>
    of<T extends { [id: string]: AbstractProperty<unknown> }, D>(id: string, propertiesOfGroup: T, optional?: { exportFcn?: (props: T) => D | null; importFcn?: (props: T, data: D | null) => void }): GroupOfProperties<T, D> {
        const processOptional = this.processOptional(optional);
        return this.propertyGroup(id, propertiesOfGroup, processOptional.exportFcn, processOptional.importFcn);
    }

    private processOptional<T extends { [id: string]: AbstractProperty<unknown> }, D>(optional?: { exportFcn?: (props: T) => D | null; importFcn?: (props: T, data: D | null) => void }): { exportFcn: (props: T) => D | null; importFcn: (props: T, data: D | null) => void } {
        return {
            exportFcn: optional?.exportFcn ?? defaultExportFcn as unknown as (props: T) => D | null,
            importFcn: optional?.importFcn ?? defaultImportFcn
        };
    }
}
