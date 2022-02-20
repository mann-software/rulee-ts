
export interface RulesVersion {
    version: string;
    compatibleWith: RegExp;
}

export const SemanticRulesVersion = (major: number, minor: number, patch: number, suffix?: string) => ({
    version: `${major}.${minor}.${patch}` + (suffix ? `-${suffix}` : ''),
    compatibleWith: new RegExp(`^${major}\\.\\d+\\.\\d+(?>-.+)?$`)
} as RulesVersion);
