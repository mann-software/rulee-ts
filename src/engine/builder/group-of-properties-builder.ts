import { AbstractProperty } from "../../properties/abstract-property";
import { GroupOfPropertiesTemplate } from "../../properties/factory/property-template";
import { PropertyGroup, GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/lists/index/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { ValidatorInstance } from "../validation/validator-instance-impl";
import { ValidationResult } from "../../validators/validation-result";

export class GroupOfPropertiesBuilder {

    constructor(
        private readonly propertyGroup: <T extends PropertyGroup>(id: string, properties: T) => GroupOfPropertiesImpl<T>
    ) { }

    template<T extends PropertyGroup>(propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => T): GroupOfPropertiesTemplate<T> {
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => this.propertyGroup(id, propertiesOfGroup(suffix => `${id}_${suffix}`, index, siblingAccess));
    }

    of<T extends PropertyGroup>(id: string, propertiesOfGroup: T): GroupOfProperties<T> {
        return this.propertyGroup(id, propertiesOfGroup);
    }

    bindValidator<T extends PropertyGroup>(group: GroupOfProperties<T>, validator: (group: T) => ValidationResult | Promise<ValidationResult>) {
        const instance: ValidatorInstance<readonly AbstractProperty[]> = {
            getValidatedProperties: () => group.propertiesAsList,
            validate: () => validator(group.properties)
        };
        (group as GroupOfPropertiesImpl<T>).addValidator(instance);
    }
}
