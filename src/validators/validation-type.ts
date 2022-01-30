
export class ValidationType {

    static readonly Error = new ValidationType('Error', false);
    static readonly Hint = new ValidationType('Hint', true);
    static readonly ErrorThrownDuringValidation = new ValidationType('ErrorThrownDuringValidation', false);

    constructor(
        public readonly name: string,
        public readonly isValid: boolean
    ) {}
}
