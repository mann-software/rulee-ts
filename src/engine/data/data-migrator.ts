import { RuleEngineData } from "./rule-engine-data";
import { SemanticRulesVersion } from "./rules-version";

export interface DataMigrator {
    readonly fromVersions: RegExp;
    readonly toVersion: string;
    migrate(data: RuleEngineData): RuleEngineData;
}

export const SemanticVersionDataMigrator = (
    fromVersions: {
        major: number;
        minor?: number;
        patch?: number;
        suffix?: string;
    },
    toVersion: {
        major: number;
        minor: number;
        patch: number;
        suffix?: string;
    },
    migrate: (data: RuleEngineData) => RuleEngineData
) => ({
    fromVersions: new RegExp(
        [fromVersions.major, fromVersions.minor, fromVersions.patch].filter(s => !!s).join('.')
        + (fromVersions.suffix ? `-${fromVersions.suffix}` : '')
    ),
    toVersion: SemanticRulesVersion(toVersion.major, toVersion.minor, toVersion.patch, toVersion.suffix).version,
    migrate
} as DataMigrator);
