import { ValidationMessage } from "./validation-message";
import { ValidationType } from "./validation-type";
import { ValidationMessagesMap } from "./validation-messages-map";
import { PropertyId } from "../properties/property-id";
import { AbstractDataProperty } from "../index";

export type ValidationMessageToString = (validationMessage: ValidationMessage, property: AbstractDataProperty<unknown>) => string;

export class ValidationResult {

    private valid?: boolean;

    constructor(
        private readonly validationMessagesMap: ValidationMessagesMap,
        private readonly getPropertyById: (id: PropertyId) => AbstractDataProperty<unknown>
    ) { }

    getValidationMessagesMap(): ValidationMessagesMap {
        return this.validationMessagesMap;
    }

    getAllMessages(): ValidationMessage[] {
        return Object.values(this.getValidationMessagesMap()).flat();
    }

    getAllMessagesAsStrings(convert: ValidationMessageToString): string[] {
        return Object.entries(this.getValidationMessagesMap()).flatMap(([id, messages]) => {
            const property = this.getPropertyById(id);
            return messages.map(message => convert(message, property));
        });
    }

    isValid(): boolean {
        if (this.valid === undefined) {
            this.valid = Object.values(this.getValidationMessagesMap()).every(messages =>
                messages.every(message => message.type.isValid)
            );
        }
        return this.valid; 
    }

    // --------------------------------------------------------------------------------
    filterByType(...types: ValidationType[]): ValidationResult {
        return this.filterBy(msg => !!types.find(type => msg.type.name === type.name));
    }

    filterValid(): ValidationResult {
        return this.filterBy(msg => msg.type.isValid);
    }

    filterInvalid(): ValidationResult {
        return this.filterBy(msg => !msg.type.isValid);
    }

    filterBy(fcn: (msg: ValidationMessage) => boolean): ValidationResult {
        const validationMap = Object.keys(this.validationMessagesMap).reduce((res, key) => {
            const filteredMsgs = this.validationMessagesMap[key].filter(msg => fcn(msg));
            if (filteredMsgs.length > 0) {
                res[key] = filteredMsgs;
            }
            return res;
        }, {} as ValidationMessagesMap);
        return new ValidationResult(validationMap, this.getPropertyById);
    }

}
