import { AbstractProperty } from "../../properties/abstract-property";
import { AbstractPropertyImpl } from "../../properties/abstract-property-impl";
import { ValidationMessage } from "../../validators/validation-message";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";


export abstract class AbstractParentPropertyRuleBuilder<D, Property extends AbstractPropertyImpl<D>> extends AbstractPropertyRuleBuilder<D, Property> {
    
    protected abstract getChildren(): AbstractProperty[];

    defineVisibleIfAllChildrenVisible() {
        this.defineVisibility(...this.getChildren())((self, ...children) =>
            children.every(child => child.isVisible())
        );
    }

    defineValidIfAllChildrenValid(message: (invalidChildren: AbstractProperty[]) => ValidationMessage) {
        this.addAsyncValidatorInternal(...this.getChildren())(async (self, ...children) => {
            await Promise.all(children.map(child => child.validate()));
            const invalidChildren = children.filter(child => child.isValid());
            if (invalidChildren.length > 0) {
                return message(invalidChildren);
            }
        });
    }

}
