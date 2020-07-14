import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/factory/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { GroupAggregator } from "../../provider/aggregator/group-aggregator";

const defaultExportFcn = (props: { [id: string]: AbstractProperty<any> }) => 
        Object.keys(props).reduce((res: {[key: string]: any}, cur: string) => {
            res[cur] = props[cur].exportData();
            return res;
        }, {});

const defaultImportFcn = (props: { [id: string]: AbstractProperty<any> }, data: { [id: string]: any } | null) => 
    data instanceof Object && Object.keys(props).forEach(key => {
        props[key].importData(data[key]);
    });

export class GroupOfPropertiesBuilder {

    constructor(
        private propertyGroup: <T extends { [id: string]: AbstractProperty<any> }, A extends { [id: string]: GroupAggregator<any> }, D>(id: string, properties: T, aggregations: A, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void) => GroupOfPropertiesImpl<T, A, D>
    ) { }

    createTemplate<T extends { [id: string]: AbstractProperty<any> }>(propertiesOfGroup: (prefix: string, index?: ListIndex) => T): PropertyTemplate<GroupOfProperties<T, {}, { [id: string]: any }>, { [id: string]: any }>
    createTemplate<T extends { [id: string]: AbstractProperty<any> }, A extends { [id: string]: GroupAggregator<any> }, D>(propertiesOfGroup: (prefix: string, index?: ListIndex) => T, optional?: { aggregations?: A, exportFcn?: (props: T) => D | null, importFcn?: (props: T, data: D | null) => void }): PropertyTemplate<GroupOfProperties<T, A, D>, D> {
        const processOptional = this.processOptional(optional);
        return (id: string, index?: ListIndex) => this.propertyGroup(id, propertiesOfGroup(id, index), processOptional.aggregations, processOptional.exportFcn, processOptional.importFcn);
    }

    of<T extends { [id: string]: AbstractProperty<any> }>(id: string, propertiesOfGroup: T): GroupOfProperties<T, {}, { [id: string]: any }>
    of<T extends { [id: string]: AbstractProperty<any> }, A extends { [id: string]: GroupAggregator<any> }, D>(id: string, propertiesOfGroup: T, optional?: { aggregations?: A, exportFcn?: (props: T) => D | null, importFcn?: (props: T, data: D | null) => void }): GroupOfProperties<T, A, D> {
        const processOptional = this.processOptional(optional);
        return this.propertyGroup(id, propertiesOfGroup, processOptional.aggregations, processOptional.exportFcn, processOptional.importFcn);
    }

    private processOptional<T extends { [id: string]: AbstractProperty<any> }, A extends { [id: string]: GroupAggregator<any> }, D>(optional?: { aggregations?: A, exportFcn?: (props: T) => D | null, importFcn?: (props: T, data: D | null) => void }): { aggregations: A, exportFcn: (props: T) => D | null, importFcn: (props: T, data: D | null) => void } {
        return {
            aggregations: optional?.aggregations ?? {} as unknown as A,
            exportFcn: optional?.exportFcn ?? defaultExportFcn as unknown as (props: T) => D | null,
            importFcn: optional?.importFcn ?? defaultImportFcn
        };
    }
}
