import { SemanticRulesVersion } from './rules-version';

test('correct semantic versioning compatibility', () => {
    const version = SemanticRulesVersion(2, 2, 1);

    expect(version.version).toBe('2.2.1');

    expect(version.compatibleWith('2022.01')).toBe(false);

    expect(version.compatibleWith('2.2.1')).toBe(true);
    expect(version.compatibleWith('2.2.2')).toBe(true);
    expect(version.compatibleWith('2.3.1')).toBe(false);

    expect(version.compatibleWith('2.0.0')).toBe(true);
    expect(version.compatibleWith('3.0.0')).toBe(false);
    expect(version.compatibleWith('1.2.1')).toBe(false);
});
