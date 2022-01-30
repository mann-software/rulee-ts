import { GroupOfPropertiesTemplate } from "../../properties/factory/property-template";
import { PropertyGroup, GroupOfProperties } from "../../properties/group-of-properties";
import { ListIndex } from "../../properties/lists/index/list-index";
import { GroupOfPropertiesImpl } from "../../properties/group-of-properties-impl";
import { SiblingAccess } from "../../provider/list-provider/sibling-access";
import { GroupOfPropertiesRulesDefinition } from "../../rules/group-of-properties-rules-definition";
import { GroupOfPropertiesRuleBuilder } from "./group-of-properties-rule-builder";

export class GroupOfPropertiesBuilder {

    constructor(
        private readonly propertyGroup: <T extends PropertyGroup>(id: string, properties: T) => GroupOfPropertiesImpl<T>
    ) { }

    template<T extends PropertyGroup>(
        propertiesOfGroup: (idFcn: (id: string) => string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => T,
        ...rulesDefintions: GroupOfPropertiesRulesDefinition<T>[]
    ): GroupOfPropertiesTemplate<T> {
        return (id: string, index?: ListIndex, siblingAccess?: SiblingAccess<GroupOfProperties<T>>) => {
            const group = this.propertyGroup(id, propertiesOfGroup(suffix => `${id}_${suffix}`, index, siblingAccess));
            this.bind(group, ...rulesDefintions);
            return group;
        }
    }

    of<T extends PropertyGroup>(
        id: string,
        propertiesOfGroup: T,
        ...rulesDefintions: GroupOfPropertiesRulesDefinition<T>[]
    ): GroupOfProperties<T> {
        const group = this.propertyGroup(id, propertiesOfGroup);
        this.bind(group, ...rulesDefintions);
        return group;
    }

    bind<T extends PropertyGroup>(prop: GroupOfProperties<T>, ...rulesDefintions: GroupOfPropertiesRulesDefinition<T>[]): void {
        const builder = new GroupOfPropertiesRuleBuilder(prop);
        rulesDefintions.forEach(def => def.apply(builder));
    }
}
