import { V } from './common-validators';
import { mock } from 'jest-mock-extended';
import { ValidationTypes } from '../validation-type';
import { PropertyScalar } from '../../properties/property-scalar';

test('not empty if required validator', () => {
    const validationMessage = { type: ValidationTypes.Error, text: 'Must not be empty' };
    const notEmptyIfRequiredValidator = V.notEmpty(validationMessage);
    const propertyScalar = mock<PropertyScalar<unknown>>();

    propertyScalar.isEmpty.mockReturnValue(true);
    propertyScalar.isRequired.mockReturnValue(true);
    expect(notEmptyIfRequiredValidator(propertyScalar)).toBe(validationMessage);
    
    propertyScalar.isRequired.mockReturnValue(false);
    expect(notEmptyIfRequiredValidator(propertyScalar)).toBe(null);
});

// TODO test other validators
