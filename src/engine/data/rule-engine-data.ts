import { PropertyId } from "../../properties/property-id";

export interface RuleEngineData {
    rulesVersion: string;
    data: Record<PropertyId, any>;
}
