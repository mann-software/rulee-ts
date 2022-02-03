import { PropertyId } from "../properties/property-id";
import { ValidationMessage } from "./validation-message";

/**
 * A map with property ids as key and validation messages as values
 */
export type ValidationMessagesMap = { [propertyId: PropertyId]: ValidationMessage[] };
