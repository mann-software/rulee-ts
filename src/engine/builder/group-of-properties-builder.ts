import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfPropertiesTemplate } from "../../properties/factory/property-template";
import { PropertyGroup, GroupOfProperties, PropertyGroupData } from "../../properties/group-of-properties";
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
        private readonly propertyGroup: <T extends PropertyGroup>(id: string, properties: T, exportFcn: (props: T) => PropertyGroupData<T> | null, importFcn: (props: T, data: PropertyGroupData<T> | null) => void) => GroupOfPropertiesImpl<T>
    ) { }

    template<T extends PropertyGroup>(propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => T): GroupOfPropertiesTemplate<T> {
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => this.propertyGroup(id, propertiesOfGroup(suffix => `${id}_${suffix}`, index, siblingAccess), defaultExportFcn, defaultImportFcn);
    }

    of<T extends PropertyGroup>(id: string, propertiesOfGroup: T): GroupOfProperties<T> {
        return this.propertyGroup(id, propertiesOfGroup, defaultExportFcn, defaultImportFcn);
    }

    bindValidator<T extends PropertyGroup, D>(group: GroupOfProperties<T>, validator: (group: T) => ValidationResult | Promise<ValidationResult>) {
        const instance: ValidatorInstance<readonly AbstractProperty[]> = {
            getValidatedProperties: () => group.propertiesAsList,
            validate: () => validator(group.properties)
        };
        (group as GroupOfPropertiesImpl<T>).addValidator(instance);
    }
}
