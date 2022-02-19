import { ValidationMessagesMap } from "../validators/validation-messages-map";
import { AbstractProperty } from "./abstract-property";
import { AbstractPropertyImpl } from "./abstract-property-impl";

export abstract class AbstractParentPropertyImpl<D> extends AbstractPropertyImpl<D> {

    /**
     * Get the children that are "owned" by this property
     */
    protected abstract getChildren(): AbstractProperty[];
    
    override async validateRecursivelyInternal(): Promise<ValidationMessagesMap> {
        const result: ValidationMessagesMap = await super.validateRecursivelyInternal();
        const validated: ValidationMessagesMap[] = await Promise.all(this.getChildren().map(child => 
            (child as AbstractPropertyImpl<unknown>).validateRecursivelyInternal()
        ));
        Object.assign(result, ...validated);
        return result;
    }
}
