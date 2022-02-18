import { ValidationMessage } from "../../index";
import { AbstractProperty } from "../../properties/abstract-property";
import { AbstractPropertyImpl } from "../../properties/abstract-property-impl";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";


export abstract class AbstractParentPropertyRuleBuilder<D, Property extends AbstractPropertyImpl<D>> extends AbstractPropertyRuleBuilder<D, Property> {
    
    protected abstract getChildren(): AbstractProperty[];

    defineVisibleIfAllChildrenVisible() {
        this.defineVisibility(...this.getChildren())((self, ...children) =>
            children.every(child => child.isVisible())
        );
    }

    defineValidIfAllChildrenValid(message: (invalidChildren: AbstractProperty[]) => ValidationMessage) {
        this.addValidatorInternal(...this.getChildren())((self, ...children) => {
            const invalidChildren = children.filter(child => child.isValid());
            return message(invalidChildren);
        });
    }

}
