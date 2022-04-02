import { PropertyId } from "../../properties/property-id";
import { RuleEngineData } from "./rule-engine-data";
import { SemanticRulesVersion } from "./rules-version";

/**
 * If {@link acceptsVersion} return true, then the {@link migrate} function will be applied.
 * The result of {@link migrate} is considered to have version {@link newVersion}.
 */
export interface DataMigrator {
    readonly acceptsVersion: (version: string) => boolean;
    readonly newVersion: string;
    migrate(data: RuleEngineData): Record<PropertyId, unknown>;
}

/**
 * Can be used to migrate from versions compatible with fromVersion to toVersion.
 */
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
