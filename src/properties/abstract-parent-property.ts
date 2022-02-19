import { ValidationResult } from "../validators/validation-result";
import { AbstractProperty } from "./abstract-property";

export interface AbstractParentProperty extends AbstractProperty {

    /**
     * Validates the children of this property and the property itsself.
     * @param recursive validate recursively (the children of the children and so on)? Default is true 
     */
    validateChildren(recursive?: boolean): Promise<ValidationResult>;
}
