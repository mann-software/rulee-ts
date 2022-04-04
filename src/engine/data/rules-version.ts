
/**
 * Version of rules. 
 * 
 * Different versions may operate on differnet data. Thus, the function {@link compatibleWith}
 * shall return true iff the data of the provided version is compatible with the {@link version} of this instance.
 */
export interface RulesVersion {
    version: string;
    compatibleWith(version: string): boolean;
}

const isSemanticVersion = /^(\d+)\.(\d+)\.(\d+)$/
/**
 * 
 * @param major increase for a breaking (non-backward-compatible) change
 * @param minor increase for backward-compatible change
 * @param patch increase for a patch/fix
 * @returns RulesVersion object
 */
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
