import { Builder, ScalarRulesDefinition, ValidationMessage, ValidationType } from "../../../index";
import { notEmptyIfSomeOtherNotEmpty as allOrNoneEmptyRule, notEmptyRule } from "./person.rules";

export function buildPerson(builder: Builder) {
    const name = builder.scalar.stringProperty('name', {}, notEmptyRule as ScalarRulesDefinition<string>);

    const address = buildAddress(builder);

    const bankAccountTemplate = builder.group.template(idFcn => buildBankAccountProperties(builder, idFcn));
    const bankAccounts = builder.list.create('bankAccounts', bankAccountTemplate);

    return builder.group.of('person', {
        name,
        address,
        bankAccounts
    });
}

function buildBankAccountProperties(builder: Builder, idFcn: (s: string) => string) {
    const iban = builder.scalar.stringProperty(idFcn('iban'));
    const owner = builder.scalar.stringProperty(idFcn('iban'));

    return {
        iban,
        owner
    };
}


function buildAddress(builder: Builder) {
    const allOrNoneEmptyMessage: ValidationMessage = { text: 'Empty!', type: ValidationType.Error };

    const postalCode = builder.scalar.stringProperty('postalCode');
    const city = builder.scalar.stringProperty('city', {
        initialValue: 'City'
    }, allOrNoneEmptyRule(allOrNoneEmptyMessage)([postalCode]) as ScalarRulesDefinition<string>);

    builder.scalar.bind(postalCode, allOrNoneEmptyRule(allOrNoneEmptyMessage)([city]));

    return builder.group.of('address', {
        postalCode,
        city
    });
}
