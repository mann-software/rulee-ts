
export class ValidationType {

    static readonly Error = new ValidationType('Error', false);
    static readonly Hint = new ValidationType('Hint', true);
    static readonly ErrorThrownDuringValidation = new ValidationType('ErrorThrownDuringValidation', false);

    constructor(
        public name: string,
        public isValid: boolean
    ) {}
}
