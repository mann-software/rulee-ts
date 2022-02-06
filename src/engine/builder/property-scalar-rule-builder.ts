import { PropertyScalar } from "../../properties/property-scalar";
import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { alwaysAssertThat } from "../../util/assertions/assertions";
import { AttributeId, A } from "../../attributes/attribute-id";
import { PropertyScalarImpl } from "../../properties/property-scalar-impl";
import { Attribute } from "../../attributes/attribute";
import { ValueChangeListener } from "../../properties/value-change-listener";
import { Rule } from "../../rules/rule";
import { PropertyScalarValidator } from "../../validators/property-validator";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { AsyncPropertyScalarValidator } from "../../validators/async-property-validator";

export class PropertyScalarRuleBuilder<T> {

    private readonly property: PropertyScalarImpl<T>;
    
    constructor(
        property: PropertyScalar<T>,
        private readonly notEmptyIfRequiredValidator: PropertyScalarValidator<unknown, []>,
        private readonly addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        private readonly textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn },
    ) {
        this.property = property as PropertyScalarImpl<T>;
    }

    // ------------------

    addValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: PropertyScalarValidator<T, Dependencies>) => PropertyScalarRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addPropertyValidator(validator);
            return this;
        };
    }

    addAsyncValidator<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncPropertyScalarValidator<T, Dependencies>) => PropertyScalarRuleBuilder<T> {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addAsyncPropertyValidator(validator, dependencies);
            return this;
        };
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

    set<A>(attribudeId: AttributeId<A>, value: A): PropertyScalarRuleBuilder<T> {
        this.defineAttributeFunction(attribudeId, [], () => value);
        return this;
    }

    define<A, Dependencies extends readonly AbstractProperty[]>(attribudeId: AttributeId<A>, ...dependencies: Dependencies): (value: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], A>) => PropertyScalarRuleBuilder<T> {
        return (value: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], A>) => {
            this.defineAttributeFunction(attribudeId, dependencies, () => value(this.property, ...dependencies));
            return this;
        };
    }

    private defineAttributeFunction<A>(attribudeId: AttributeId<A>, dependencies: readonly AbstractProperty[], fcn: () => A) {
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

    setVisibility(isVisible: boolean): PropertyScalarRuleBuilder<T> {
        if (isVisible === false) { // true is default -> no need to set
            this.defineVisibilityFunction([], () => isVisible);
        } else {
            this.property.defineVisibility(undefined);
        }
        return this;
    }

    defineVisibility<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (isVisible: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => PropertyScalarRuleBuilder<T> {
        return (isVisible: Rule<[self: PropertyScalar<T>, ...dependencies: Dependencies], boolean>) => {
            this.defineVisibilityFunction(dependencies, () => isVisible(this.property, ...dependencies));
            return this;
        };
    }

    private defineVisibilityFunction(dependencies: readonly AbstractProperty[], fcn: () => boolean) {
        this.addDependencies(dependencies, this.property, { visible: true });
        this.property.defineVisibility({
            id: A.Visible,
            dependencies: dependencies,
            getValue: fcn
        } as Attribute<boolean>);
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
        this.property.addPropertyValidator(this.notEmptyIfRequiredValidator);
    }
    
    // ------------------

    defineLabelAndPlaceholder(text: string): PropertyScalarRuleBuilder<T> {
        this.defineLabel(text);
        return this.definePlaceholder(text);
    }

    defineLabel(text: string, textInterpreter?: TextInterpreter): PropertyScalarRuleBuilder<T> {
        this.checkTextInterpreterAvailable(textInterpreter);
        this.property.defineLabel(this.interpreteText(text, textInterpreter));
        return this;
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

    private interpreteText(text: string, textInterpreter?: TextInterpreter) {
        if (textInterpreter !== undefined) {
            const interpreter = this.textInterpreters[textInterpreter];
            return interpreter?.interpreteText(text) ?? text;
        }
        return text;
    }

    private checkTextInterpreterAvailable(textInterpreter?: TextInterpreter) {
        alwaysAssertThat(
            textInterpreter === undefined || this.textInterpreters[textInterpreter] !== undefined,
            () => `Text interpreter '${textInterpreter}' not found. Please provide via builder options.`
        );
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
    setToInitialStateOnOtherPropertyChanged(...otherProperties: AbstractProperty[]) {
        alwaysAssertThat(!this.property.isReadOnly(), () => `${this.property.id}: Can only set properties to initial value, that are not read only`);
        otherProperties.forEach(prop => prop.registerValueChangedListener({
            updated: () => this.property.setToInitialState()
        }));
        return this;
    }
}
