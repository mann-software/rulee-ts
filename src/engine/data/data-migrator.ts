import { PropertyId } from "../../properties/property-id";
import { RuleEngineData } from "./rule-engine-data";
import { SemanticRulesVersion } from "./rules-version";

export interface DataMigrator {
    readonly acceptsVersion: (version: string) => boolean;
    readonly newVersion: string;
    migrate(data: RuleEngineData): Record<PropertyId, unknown>;
}

export const SemanticVersionDataMigrator = (
    fromVersion: {
        major: number;
        minor: number;
        patch: number;
    },
    toVersion: {
        major: number;
        minor: number;
        patch: number;
    },
    migrate: (data: RuleEngineData) => Record<PropertyId, unknown>
) => ({
    acceptsVersion: version => SemanticRulesVersion(fromVersion.major, fromVersion.minor, fromVersion.patch).compatibleWith(version),
    newVersion: SemanticRulesVersion(toVersion.major, toVersion.minor, toVersion.patch).version,
    migrate
} as DataMigrator);
