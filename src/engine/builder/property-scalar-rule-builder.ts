import { PropertyScalar } from "../../properties/property-scalar";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { alwaysAssertThat } from "../../util/assertions/assertions";
import { A } from "../../attributes/attribute-id";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { Attribute } from "../../attributes/attribute";
import { Rule } from "../../rules/rule";
import { PropertyScalarValidator } from "../../validators/property-validator";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { AsyncPropertyScalarValidator } from "../../validators/async-property-validator";
import { AbstractPropertyRuleBuilder } from "./abstract-property-rule-builder-impl";

export class PropertyScalarRuleBuilder<T> extends AbstractPropertyRuleBuilder<T, PropertyScalarImpl<T>> {
    
    constructor(
        property: PropertyScalar<T>,
        private readonly notEmptyIfRequiredValidator: PropertyScalarValidator<unknown, []>,
        addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        super(property as PropertyScalarImpl<T>, addDependencies, textInterpreters);
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: PropertyScalarValidator<T, Dependencies>) => PropertyScalarRuleBuilder<T> {
        return this.addValidatorInternal(...dependencies);
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncPropertyScalarValidator<T, Dependencies>) => PropertyScalarRuleBuilder<T> {
        return this.addAsyncValidatorInternal(...dependencies);
    }

    // ------------------

    /**
     * Defines a initial value and also sets the property to this value - only possible if the property is not readonly
     * 
     * @param value initial value
     */
    defineInitialValue(value: T): PropertyScalarRuleBuilder<T> {
        alwaysAssertThat(!this.property.isReadOnly(), () => `${this.property.id}: Can not define initial value on read only property`);
        this.property.defineInitialValue(value);
        this.property.setToInitialState();
        return this;
    }

    // ------------------

    setRequiredIfVisible(required: boolean): PropertyScalarRuleBuilder<T> {
        if (required) { // false is default -> no need to set
            this.defineRequiredIfVisibleFunction([], () => required);
        } else {
            this.property.defineRequiredIfVisible(undefined);
        }
        return this;
    }

    defineRequiredIfVisible<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (required: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => PropertyScalarRuleBuilder<T> {
        return (required: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => {
            this.defineRequiredIfVisibleFunction(dependencies, () => required(this.property, ...dependencies));
            return this;
        };
    }

    private defineRequiredIfVisibleFunction(dependencies: readonly AbstractProperty[], fcn: () => boolean) {
        this.addDependencies(dependencies, this.property, { required: true });
        this.property.defineRequiredIfVisible({
            id: A.Required,
            dependencies: dependencies,
            getValue: fcn
        } as Attribute<boolean>);
        this.property.addPropertyValidator(this.notEmptyIfRequiredValidator, []);
    }
    
    // ------------------

    defineLabelAndPlaceholder(text: string): PropertyScalarRuleBuilder<T> {
        this.defineLabel(text);
        return this.definePlaceholder(text);
    }

    definePlaceholder(placeholder: string): PropertyScalarRuleBuilder<T> {
        this.property.definePlaceholder(placeholder);
        return this;
    }

    defineInfoText(text: string, textInterpreter?: TextInterpreter): PropertyScalarRuleBuilder<T> {
        this.checkTextInterpreterAvailable(textInterpreter);
        this.property.defineInfoText(this.interpreteText(text, textInterpreter));
        return this;
    }
    
    // ------------------
}
