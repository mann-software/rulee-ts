
export interface RulesVersion {
    version: string;
    compatibleWith(version: string): boolean;
}

const isSemanticVersion = /^(\d+)\.(\d+)\.(\d+)$/
export const SemanticRulesVersion = (major: number, minor: number, patch: number) => ({
    version: `${major}.${minor}.${patch}`,
    compatibleWith: version => {
        const match = isSemanticVersion.exec(version);
        if (match == null) {
            return false;
        }
        const majorOther = Number.parseInt(match[1]);
        const minorOther = Number.parseInt(match[2]);
        return major == majorOther && minor >= minorOther;
    }
} as RulesVersion);
