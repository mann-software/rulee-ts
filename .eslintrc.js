module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'jest',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:jest/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig-lint.json',
    },
    rules: {
        // disabled for generic code that implies some conditions the linter does not know
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-unsafe-call": 0,
        "@typescript-eslint/no-unsafe-member-access": 0,
        "@typescript-eslint/no-unsafe-return": 0,
        "@typescript-eslint/no-non-null-assertion": 0, // needed in rare case, where the ts linter does not know a condition that holds
        "@typescript-eslint/explicit-module-boundary-types": 0, // would be very useful for class functions but would make a lot of arrow fcns unconcise
        "@typescript-eslint/no-unused-vars": 0, // quite often there are hooks that get implemented and this specfic impl does not need the variable, however I want to see, that there is this variable in case I need to change the impl and therefore maybe need that var
        "@typescript-eslint/restrict-template-expressions": 0,
        "@typescript-eslint/array-type": 1,
        "@typescript-eslint/consistent-type-assertions": 1,
        "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
        "@typescript-eslint/member-delimiter-style": 1,
        "camelcase": "off",
        "@typescript-eslint/naming-convention": [
            "error",
            {
                "selector": "default",
                "format": ["camelCase"]
            },
            {
                "selector": "typeLike",
                "format": ["PascalCase"]
            },
            {
                "selector": "property",
                "modifiers": ["static"],
                "format": ["UPPER_CASE"]
            },
            {
                "selector": "property",
                "modifiers": ["public"],
                "format": ["camelCase", "PascalCase"]
            },
            {
                "selector": "variable",
                "format": ["camelCase", "PascalCase"]
            },
            {
                "selector": "enumMember",
                "format": ["PascalCase"]
            }
        ],
        "@typescript-eslint/no-confusing-non-null-assertion": 1,
        "@typescript-eslint/prefer-optional-chain": 1,
        "@typescript-eslint/prefer-readonly": 1,
        "@typescript-eslint/switch-exhaustiveness-check": 1,
        "@typescript-eslint/type-annotation-spacing": 1
    },
};