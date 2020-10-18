import { AbstractProperty, DataTypeOfProperty } from "../../properties/abstract-property";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/factory/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";

const defaultExportFcn = <T extends { [id: string]: AbstractProperty<unknown> }>(props: T) =>
    Object.keys(props).reduce((res: {[key: string]: unknown}, cur: string) => {
        res[cur] = props[cur].exportData();
        return res;
    }, {});

const defaultImportFcn = <T extends { [id: string]: AbstractProperty<unknown> }>(props: T, data: { [id: string]: any } | null) =>
    data instanceof Object && Object.keys(props).forEach(key => {
        props[key].importData(data[key]);
    });

type GroupData<T extends { [id: string]: AbstractProperty<unknown> }> = { [K in keyof T]: DataTypeOfProperty<T[K]> };

export class GroupOfPropertiesBuilder {

    constructor(
        private readonly propertyGroup: <T extends { [id: string]: AbstractProperty<unknown> }, D>(id: string, properties: T, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void) => GroupOfPropertiesImpl<T, D>
    ) { }

    template<T extends { [id: string]: AbstractProperty<unknown> }>(propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T, GroupData<T>>, unknown>) => T): PropertyTemplate<GroupOfProperties<T, GroupData<T>>, GroupData<T>>
    template<T extends { [id: string]: AbstractProperty<unknown> }, D>(propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T, D>, D>) => T, optional?: { exportFcn?: (props: T) => D | null; importFcn?: (props: T, data: D | null) => void }): PropertyTemplate<GroupOfProperties<T, D>, D> {
        const processOptional = this.processOptional(optional);
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T, D>, D>) => this.propertyGroup(id, propertiesOfGroup(suffix => `${id}_${suffix}`, index, siblingAccess), processOptional.exportFcn, processOptional.importFcn);
    }

    of<T extends { [id: string]: AbstractProperty<unknown> }>(id: string, propertiesOfGroup: T): GroupOfProperties<T, { [K in keyof T]: DataTypeOfProperty<T[K]> }>
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
