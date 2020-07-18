import { V } from './common-validators';
import { ValidationError } from './validation-type';
import { PropertyScalar } from '../properties/property-scalar';
import { mock } from 'jest-mock-extended';

test('not empty if required validator', () => {
    const validationMessage = { type: ValidationError, text: 'Must not be empty' };
    const notEmptyIfRequiredValidator = V.notEmpty(validationMessage);
    const propertyScalar = mock<PropertyScalar<unknown>>();

    propertyScalar.isEmpty.mockReturnValue(true);
    propertyScalar.isRequired.mockReturnValue(true);
    expect(notEmptyIfRequiredValidator.validate(propertyScalar)).toBe(validationMessage);
    
    propertyScalar.isRequired.mockReturnValue(false);
    expect(notEmptyIfRequiredValidator.validate(propertyScalar)).toBe(null);
});

// TODO test other validators
