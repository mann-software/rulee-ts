import { builderAndRuleEngineFactory } from "../utils/test-utils";
import { RuleEngine } from "../../engine/rule-engine";
import { buildPerson } from "./common/person.properties";
import { AbstractDataProperty } from "../../properties/abstract-data-property";
import { Person } from "./common/person.api";

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

test('validation on client and server should return the same result - test on whole rule engine', async () => {
    /// validate on client side:
    const clientValidationResult = await clientEngine.validateAllProperties();
    expect(clientValidationResult.getAllMessages().length).toBe(2);

    const clientData = clientRootProperty.exportData();
    // simulate sending the data to the server
    // the rational is the follwing: if the data is sent to the server, the data is serialized, transfered and deserialized
    // thus, the relevant part of this test is to serialized and deserialized the data
    const serverData = JSON.parse(JSON.stringify(clientData)) as Person
    serverRootProperty.importData(serverData);
    
    // validate on server side
    const serverValidationResult = await serverEngine.validateAllProperties();

    // the validations must be the same
    expect(serverValidationResult.getAllMessages()).toStrictEqual(clientValidationResult.getAllMessages());
});

test('validation on client and server should return the same result - test on root property', async () => {
    /// validate on client side:
    const clientValidationResult = await clientEngine.getPropertyById('person')!.validateRecursively();
    expect(clientValidationResult.getAllMessages().length).toBe(2);

    const clientData = clientRootProperty.exportData();
    // simulate sending the data to the server
    // the rational is the follwing: if the data is sent to the server, the data is serialized, transfered and deserialized
    // thus, the relevant part of this test is to serialized and deserialized the data
    const serverData = JSON.parse(JSON.stringify(clientData)) as Person
    serverRootProperty.importData(serverData);
    
    // validate on server side
    const serverValidationResult = await serverEngine.getPropertyById('person')!.validateRecursively();

    // the validations must be the same
    expect(serverValidationResult.getAllMessages()).toStrictEqual(clientValidationResult.getAllMessages());
});

test('validation of single root property should return same result as full rule engine validation', async () => {
    const clientValidationResult = await clientEngine.getPropertyById('person')!.validateRecursively();
    const clientEngineValidationResult = await clientEngine.validateAllProperties();
    expect(clientEngineValidationResult.getAllMessages()).toStrictEqual(clientValidationResult.getAllMessages());
});
