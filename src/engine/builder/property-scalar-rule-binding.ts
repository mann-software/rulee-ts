import { PropertyScalar } from "../../properties/property-scalar";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { alwaysAssertThat } from "../../util/assertions/assertions";
import { AttributeId, A } from "../../attributes/attribute-id";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { Attribute } from "../../attributes/attribute";
import { ValueChangeListener } from "../../properties/value-change-listener";
import { Rule } from "../../rules/rule";
import { ScalarValidator } from "../../validators/scalar-validator";
import { ValidationMessage } from "../../validators/validation-message";

export enum TextInterpreter {
    Plain, Markdown, Html
}

export class PropertyScalarRuleBinding<T> {

    private readonly property: PropertyScalarImpl<T>;
    
    constructor(
        property: PropertyScalar<T>,
        private readonly notEmptyIfRequiredValidator: ScalarValidator<unknown>,
        private readonly addDependencies: (from: readonly AbstractProperty<unknown>[], to: AbstractProperty<T>, options: PropertyDependencyOptions) => void
    ) {
        this.property = property as PropertyScalarImpl<T>;
    }

    // ------------------

    addScalarValidator(validator: ScalarValidator<T>): PropertyScalarRuleBinding<T> {
        this.property.addScalarValidator(validator);
        return this;
    }

    addAsyncScalarValidator(validator: (property: PropertyScalar<T>) => Promise<ValidationMessage[] | undefined>): PropertyScalarRuleBinding<T> {
        this.property.addValidator({
            getValidatedProperties: () => [this.property],
            validate: (prop) => validator(prop as PropertyScalar<T>)
        });
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

    set<A>(attribudeId: AttributeId<A>, value: A): PropertyScalarRuleBinding<T> {
        this.defineAttributeFunction(attribudeId, [], () => value);
        return this;
    }

    define<A, Dependencies extends readonly AbstractProperty<unknown>[]>(attribudeId: AttributeId<A>, ...dependencies: Dependencies): (value: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], A>) => PropertyScalarRuleBinding<T> {
        return (value: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], A>) => {
            this.defineAttributeFunction(attribudeId, dependencies, () => value(this.property, ...dependencies));
            return this;
        };
    }

    private defineAttributeFunction<A>(attribudeId: AttributeId<A>, dependencies: readonly AbstractProperty<unknown>[], fcn: () => A) {
        alwaysAssertThat(!A[attribudeId.name], () => {
            const mapping: {[attrName: string]: string} = {
                Required: 'defineRequiredIfVisible',
                Visible: 'defineVisibility',
                Label: 'defineLabel',
                InfoText: 'defineInfoText'
            }
            return `Please use specialised function ${mapping[attribudeId.name]} to define ${attribudeId.name}`;
        });
        this.addDependencies(dependencies, this.property, { [attribudeId.name]: true });
        this.property.defineAttribute({
            id: attribudeId,
            dependencies: dependencies,
            getValue: fcn
        } as Attribute<A>);
    }
    
    // ------------------

    setVisibility(isVisible: boolean): PropertyScalarRuleBinding<T> {
        if (isVisible === false) { // true is default -> no need to set
            this.defineVisibilityFunction([], () => isVisible);
        } else {
            this.property.defineVisibility(undefined);
        }
        return this;
    }

    defineVisibility<Dependencies extends readonly AbstractProperty<unknown>[]>(...dependencies: Dependencies): (isVisible: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => PropertyScalarRuleBinding<T> {
        return (isVisible: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => {
            this.defineVisibilityFunction(dependencies, () => isVisible(this.property, ...dependencies));
            return this;
        };
    }

    private defineVisibilityFunction(dependencies: readonly AbstractProperty<unknown>[], fcn: () => boolean) {
        this.addDependencies(dependencies, this.property, { visible: true });
        this.property.defineVisibility({
            id: A.Visible,
            dependencies: dependencies,
            getValue: fcn
        } as Attribute<boolean>);
    }

    // ------------------

    setRequiredIfVisible(required: boolean): PropertyScalarRuleBinding<T> {
        if (required) { // false is default -> no need to set
            this.defineRequiredIfVisibleFunction([], () => required);
        } else {
            this.property.defineRequiredIfVisible(undefined);
        }
        return this;
    }

    defineRequiredIfVisible<Dependencies extends readonly AbstractProperty<unknown>[]>(...dependencies: Dependencies): (required: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => PropertyScalarRuleBinding<T> {
        return (required: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => {
            this.defineRequiredIfVisibleFunction(dependencies, () => required(this.property, ...dependencies));
            return this;
        };
    }

    private defineRequiredIfVisibleFunction(dependencies: readonly AbstractProperty<unknown>[], fcn: () => boolean) {
        this.addDependencies(dependencies, this.property, { required: true });
        this.property.defineRequiredIfVisible({
            id: A.Required,
            dependencies: dependencies,
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
