import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyTemplate } from "../../properties/factory/property-template";
import { GroupedProperties, GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/factory/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { ValidationResult } from "../../validators/validation-result";
import { DataTypeAsProperty } from "../../properties/abstract-data-property";

const defaultExportFcn: any = <D extends Record<string, unknown>>(props: { [K in keyof D]: DataTypeAsProperty<D[K]> }) =>
    Object.keys(props).reduce((res: {[key: string]: unknown}, cur: string) => {
        res[cur] = props[cur].exportData();
        return res;
    }, {});

const defaultImportFcn: any = <D extends Record<string, unknown>>(props: { [K in keyof D]: DataTypeAsProperty<D[K]> }, data: D | null) =>
    data instanceof Object && Object.keys(props).forEach(key => {
        props[key].importData(data[key]);
    });

export class GroupOfPropertiesBuilder {

    constructor(
        private readonly propertyGroup: <D>(id: string, properties: GroupedProperties<D>, exportFcn: (props: GroupedProperties<D>) => D | null, importFcn: (props: GroupedProperties<D>, data: D | null) => void) => GroupOfPropertiesImpl<GroupedProperties<D>, D>
    ) { }

    template<D>(propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<GroupedProperties<D>, D>>) => GroupedProperties<D>): PropertyTemplate<GroupOfProperties<GroupedProperties<D>, D>, D> {
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<GroupedProperties<D>, D>>) => this.propertyGroup(id, propertiesOfGroup(suffix => `${id}_${suffix}`, index, siblingAccess), defaultExportFcn, defaultImportFcn);
    }

    of<D>(id: string, propertiesOfGroup: GroupedProperties<D>): GroupOfProperties<GroupedProperties<D>, D> {
        return this.propertyGroup(id, propertiesOfGroup, defaultExportFcn, defaultImportFcn);
    }

    bindValidator<T extends { [id: string]: AbstractProperty }, D>(group: GroupOfProperties<T, D>, validator: (group: T) => ValidationResult | Promise<ValidationResult>) {
        const instance: ValidatorInstance<readonly AbstractProperty[]> = {
            getValidatedProperties: () => group.propertiesAsList,
            validate: () => validator(group.properties)
        };
        (group as GroupOfPropertiesImpl<T, D>).addValidator(instance);
    }
}
