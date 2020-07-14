export interface ValidationType {
    name: string;
    isValid: boolean;
}

export const ValidationError: ValidationType = {
    name: 'ValidationError',
    isValid: false
};

export const ValidationHint: ValidationType = {
    name: 'ValidationHint',
    isValid: true
}
