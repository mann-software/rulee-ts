import { builderAndRuleEngineFactory } from "../utils/test-utils";
import { RuleEngine } from "../../engine/rule-engine";
import { buildPerson } from "./common/person.properties";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { Person } from "./common/person.api";
import { PropertyScalar } from "../../properties/property-scalar";

let clientEngine: RuleEngine;
let clientRootProperty: AbstractDataProperty<unknown>;

let serverEngine: RuleEngine;
let serverRootProperty: AbstractDataProperty<unknown>;

function setupRuleEngine(): [RuleEngine, AbstractDataProperty<unknown>] {
    const [builder, engine] = builderAndRuleEngineFactory();
    const person = buildPerson(builder);
    return [engine, person];
}

beforeEach(() => {
    [clientEngine, clientRootProperty] = setupRuleEngine();
    [serverEngine, serverRootProperty] = setupRuleEngine();
});

test('validation on client and server should return the same result - test with no async rules', async () => {
    const city = clientEngine.getPropertyById('city') as PropertyScalar<string>;
    city.setDisplayValue('City');
    /// validate on client side:
    const clientValidationMsgs = await clientEngine.validate();
    expect(Object.keys(clientValidationMsgs).length).toBe(2);

    const clientData = clientRootProperty.exportData();
    // simulate sending the data to the server
    // the rational is the follwing: if the data is sent to the server, the data is serialized, transfered and deserialized
    // thus, the relevant part of this test is to serialized and deserialized the data
    const serverData = JSON.parse(JSON.stringify(clientData)) as Person
    serverRootProperty.importData(serverData);
    
    // validate on server side
    const serverValidationMsgs = await serverEngine.validate();

    // the validations must be the same
    expect(serverValidationMsgs).toStrictEqual(clientValidationMsgs);
});
