import { ValidationMessagesMap } from "../validators/validation-messages-map";
import { ValidationResult } from "../validators/validation-result";
import { AbstractProperty } from "./abstract-property";
import { AbstractPropertyImpl } from "./abstract-property-impl";

function isParentProperty(property: AbstractProperty): property is AbstractParentPropertyImpl<unknown> {
    return (property as any)['validateRecursive'] !== undefined;
}

export abstract class AbstractParentPropertyImpl<D> extends AbstractPropertyImpl<D> {

    /**
     * Get the children that are "owned" by this property
     */
    protected abstract getChildren(): AbstractProperty[];

    /**
     * Validates recursively the children of this property and the property itsself
     */
    async validateRecursive(): Promise<ValidationResult> {
        const validationMap = await this.validateRecursiveInternal();
        return new ValidationResult(validationMap, (id) => this.updateHandler.getPropertyById(id)!)
    }
    
    private async validateRecursiveInternal(): Promise<ValidationMessagesMap> {
        let result = {} as ValidationMessagesMap;
        for (const child of this.getChildren()) {
            if (isParentProperty(child)) {
                result = this.merge(result, await child.validateRecursiveInternal());
            } else {
                result[child.id] = await child.validate();
            }
        }
        return result;
    }

    private merge(first: ValidationMessagesMap, second: ValidationMessagesMap) {
        return {
            ...first,
            ... second
        }
    }
}
