import { ValidationMessage } from "./validation-message";
import { ValidationType } from "./validation-type";
import { ValidationMessagesMap } from "./validation-messages-map";


export class ValidationResult {

    constructor(
        private readonly validationMessagesMap: ValidationMessagesMap
    ) { }

    getValidationMessagesMap() {
        return this.validationMessagesMap;
    }

    getAllMessages() {
        return this.flatten(this.validationMessagesMap);
    }

    private flatten(map: ValidationMessagesMap): ValidationMessage[] {
        return Object.values(map).flat();
    }

    // --------------------------------------------------------------------------------
    getAllMessagesOfType(type: ValidationType): ValidationMessage[] {
        return this.flatten(this.filterByType(type));
    }

    getAllValidMessages(): ValidationMessage[] {
        return this.flatten(this.filterValid());
    }

    getAllInvalidMessages(): ValidationMessage[] {
        return this.flatten(this.filterInvalid());
    }

    getAllMessagesBy(fcn: (msg: ValidationMessage) => boolean): ValidationMessage[] {
        return this.flatten(this.filterBy(fcn));
    }

    // --------------------------------------------------------------------------------
    filterByType(type: ValidationType): ValidationMessagesMap {
        return this.filterBy(msg => msg.type.name === type.name);
    }

    filterValid(): ValidationMessagesMap {
        return this.filterBy(msg => msg.type.isValid);
    }

    filterInvalid(): ValidationMessagesMap {
        return this.filterBy(msg => !msg.type.isValid);
    }

    filterBy(fcn: (msg: ValidationMessage) => boolean): ValidationMessagesMap {
        return Object.keys(this.validationMessagesMap).reduce((res, key) => {
            const filteredMsgs = this.validationMessagesMap[key].filter(msg => fcn(msg));
            if (filteredMsgs.length > 0) {
                res[key] = filteredMsgs;
            }
            return res;
        }, {} as ValidationMessagesMap);
    }

}
