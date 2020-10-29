
export interface ValidationType {
    name: string;
    isValid: boolean;
}

const ValidationError: ValidationType = {
    name: 'Error',
    isValid: false
};

const ValidationHint: ValidationType = {
    name: 'Hint',
    isValid: true
}

const ErrorThrownDuringValidation: ValidationType = {
    name: 'ErrorThrown',
    isValid: true
};

/**
 * Set of predefined ValidationTypes
 */
export const ValidationTypes = {
    Error: ValidationError,
    Hint: ValidationHint,
    ErrorThrownDuringValidation
}
