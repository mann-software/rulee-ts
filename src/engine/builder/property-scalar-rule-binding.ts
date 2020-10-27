import { PropertyScalar } from "../../properties/property-scalar";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { alwaysAssertThat } from "../../util/assertions/assertions";
import { AttributeId, A } from "../../attributes/attribute-id";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { Attribute } from "../../attributes/attribute";
import { ScalarValidator, Validator } from "../../validators/validator";
import { ValueChangeListener } from "../../properties/value-change-listener";
import { Rule } from "../../rules/rule";

export enum TextInterpreter {
    Plain, Markdown, Html
}

export class PropertyScalarRuleBinding<T> {

    private readonly property: PropertyScalarImpl<T>;
    
    constructor(
        property: PropertyScalar<T>,
        private readonly notEmptyIfRequiredValidator: ScalarValidator<unknown>,
        private readonly addDependencies: (from: AbstractProperty<unknown>[], to: AbstractProperty<T>, options: PropertyDependencyOptions) => void
    ) {
        this.property = property as PropertyScalarImpl<T>;
    }

    // ------------------

    addScalarValidator(validator: ScalarValidator<T>): PropertyScalarRuleBinding<T> {
        this.property.addScalarValidator(validator);
        return this;
    }

    addValidator(validator: Validator): PropertyScalarRuleBinding<T> {
        this.property.addValidator(validator);
        const dependencies = validator.getValidatedProperties().concat(validator.getAdditionalProperties());
        this.addDependencies(dependencies, this.property, { validation: true });
        return this;
    }
    
    // ------------------

    /**
     * Defines a initial value and also sets the property to this value - only possible if the property is not readonly
     * 
     * @param value initial value
     */
    defineInitialValue(value: T): PropertyScalarRuleBinding<T> {
        alwaysAssertThat(!this.property.isReadOnly(), () => `${this.property.id}: Can not define initial value on read only property`);
        this.property.defineInitialValue(value);
        this.property.setToInitialValue();
        return this;
    }
    
    // ------------------

    define<A>(attribudeId: AttributeId<A>, value: A | Rule<[self: PropertyScalar<T>], A>): PropertyScalarRuleBinding<T> {
        if (value instanceof Function) {
            this.defineAttributeFunction(attribudeId, [], () => value(this.property));
        } else {
            this.defineAttributeFunction(attribudeId, [], () => value);
        }
        return this;
    }

    // TODO define1, 2 , etc

    private defineAttributeFunction<A>(attribudeId: AttributeId<A>, deps: AbstractProperty<unknown>[], fcn: () => A) {
        alwaysAssertThat(!A[attribudeId.name], () => {
            const mapping: {[attrName: string]: string} = {
                Required: 'defineRequiredIfVisible',
                Visible: 'defineVisibility',
                Label: 'defineLabel',
                InfoText: 'defineInfoText'
            }
            return `Please use specialised function ${mapping[attribudeId.name]} to define ${attribudeId.name}`;
        });
        this.addDependencies(deps, this.property, { [attribudeId.name]: true });
        this.property.defineAttribute({
            id: attribudeId,
            dependencies: deps,
            getValue: fcn
        } as Attribute<A>);
    }
    
    // ------------------

    defineVisibility(isVisible: boolean | Rule<[self: PropertyScalar<T>], boolean>): PropertyScalarRuleBinding<T> {
        if (isVisible === false) { // true is default -> no need to set
            this.defineVisibilityFunction([], () => isVisible);
        } else if (isVisible instanceof Function) {
            this.defineVisibilityFunction([], () => isVisible(this.property));
        }
        return this;
    }

    defineVisibility1<D1 extends AbstractProperty<unknown>>(dep1: D1, isVisible: Rule<[self: PropertyScalar<T>, dep1: D1], boolean>): PropertyScalarRuleBinding<T> {
        this.defineVisibilityFunction([dep1], () => isVisible(this.property, dep1));
        return this;
    }

    defineVisibility2<D1 extends AbstractProperty<unknown>, D2 extends AbstractProperty<unknown>>(dep1: D1, dep2: D2, isVisible: Rule<[self: PropertyScalar<T>, dep1: D1, dep2: D2], boolean>): PropertyScalarRuleBinding<T> {
        this.defineVisibilityFunction([dep1, dep2], () => isVisible(this.property, dep1, dep2));
        return this;
    }

    private defineVisibilityFunction(deps: AbstractProperty<unknown>[], fcn: () => boolean) {
        this.addDependencies(deps, this.property, { visible: true });
        this.property.defineVisibility({
            id: A.Visible,
            dependencies: deps,
            getValue: fcn
        } as Attribute<boolean>);
    }

    // ------------------

    defineRequiredIfVisible(required: boolean | Rule<[self: PropertyScalar<T>], boolean>): PropertyScalarRuleBinding<T> {
        if (required === true) { // false is default -> no need to set
            this.defineRequiredIfVisibleFunction([], () => required);
        } else if (required instanceof Function) {
            this.defineRequiredIfVisibleFunction([], () => required(this.property));
        }
        return this;
    }

    // TODO defineRequiredIfVisible1, 2 , etc

    private defineRequiredIfVisibleFunction(deps: AbstractProperty<unknown>[], fcn: () => boolean) {
        this.addDependencies(deps, this.property, { required: true });
        this.property.defineRequiredIfVisible({
            id: A.Required,
            dependencies: deps,
            getValue: fcn
        } as Attribute<boolean>);
        this.property.addScalarValidator(this.notEmptyIfRequiredValidator);
    }
    
    // ------------------

    defineLabelAndPlaceholder(text: string): PropertyScalarRuleBinding<T> {
        this.defineLabel(text);
        return this.definePlaceholder(text);
    }

    defineLabel(text: string, textInterpreter?: TextInterpreter): PropertyScalarRuleBinding<T> {
        this.property.defineLabel(this.interpreteText(text, textInterpreter));
        return this;
    }

    definePlaceholder(placeholder: string): PropertyScalarRuleBinding<T> {
        this.property.definePlaceholder(placeholder);
        return this;
    }

    defineInfoText(text: string, textInterpreter?: TextInterpreter): PropertyScalarRuleBinding<T> {
        this.property.defineInfoText(this.interpreteText(text, textInterpreter));
        return this;
    }

    private interpreteText(text: string, textInterpreter?: TextInterpreter) {
        // TODO interprete the text
        return text;
    }
    
    // ------------------

    /**
     * Set a callback that is called if the value of the property is updated.
     * If possible, prefer using DerivedProperties
     * 
     * @param changed callback
     */
    onUpdated(updated: (self: PropertyScalar<T>) => void) {
        this.property.registerValueChangedListener({
            updated: () => updated(this.property)
        } as ValueChangeListener);
        return this;
    }

    /**
     * provide a list of other properties that will reset the current property if one of them changed
     * @param resetIfOneOfTheseChanged list with properties that - if changed - will reset the current prop
     */
    setToInitialValueOnOtherPropertyChanged(...otherProperties: AbstractProperty<unknown>[]) {
        alwaysAssertThat(!this.property.isReadOnly(), () => `${this.property.id}: Can only set properties to initial value, that are not read only`);
        // TODO 
        return this;
    }
}
