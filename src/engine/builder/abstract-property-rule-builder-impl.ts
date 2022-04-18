import { AbstractProperty } from "../../properties/abstract-property";
import { PropertyDependencyOptions } from "../../dependency-graph/property-dependency";
import { alwaysAssertThat } from "../../util/assertions/assertions";
import { AttributeId, A } from "../../attributes/attribute-id";
import { Attribute } from "../../attributes/attribute";
import { ValueChangeListener } from "../../properties/value-change-listener";
import { Rule } from "../../rules/rule";
import { TextInterpreter, TextInterpreterFcn } from "../../util/text-interpreter/text-interpreter";
import { AbstractPropertyImpl } from "../../properties/abstract-property-impl";
import { PropertyValidator } from "../../validators/property-validator";
import { AsyncPropertyValidator } from "../../validators/async-property-validator";

export abstract class AbstractPropertyRuleBuilder<D, Property extends AbstractPropertyImpl<D>> {

    constructor(
        protected readonly property: Property,
        protected readonly addDependencies: (from: readonly AbstractProperty[], to: AbstractProperty, options: PropertyDependencyOptions) => void,
        protected readonly textInterpreters: { [textInterpreter in TextInterpreter]?:  TextInterpreterFcn }
    ) { }

    // ------------------

    protected addValidatorInternal<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: PropertyValidator<Property, Dependencies>) => this {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addPropertyValidator(validator, dependencies);
            return this;
        };
    }

    protected addAsyncValidatorInternal<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (validator: AsyncPropertyValidator<Property, Dependencies>) => this {
        this.addDependencies(dependencies, this.property, { validation: true });
        return validator => {
            this.property.addAsyncPropertyValidator(validator, dependencies);
            return this;
        };
    }

    set<A>(attribudeId: AttributeId<A>, value: A): this {
        this.defineAttributeFunction(attribudeId, [], () => value);
        return this;
    }

    define<A, Dependencies extends readonly AbstractProperty[]>(attribudeId: AttributeId<A>, ...dependencies: Dependencies): (value: Rule<[self: Property, ...dependencies: Dependencies], A>) => this {
        return (value: Rule<[self: Property, ...dependencies: Dependencies], A>) => {
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

    setVisibility(isVisible: boolean): this {
        if (isVisible === false) { // true is default -> no need to set
            this.defineVisibilityFunction([], () => isVisible);
        } else {
            this.property.defineVisibility(undefined);
        }
        return this;
    }

    defineVisibility<Dependencies extends readonly AbstractProperty[]>(...dependencies: Dependencies): (isVisible: Rule<[self: Property, ...dependencies: Dependencies], boolean>) => this {
        return (isVisible: Rule<[self: Property, ...dependencies: Dependencies], boolean>) => {
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

    defineLabel(text: string, textInterpreter?: TextInterpreter): this {
        this.checkTextInterpreterAvailable(textInterpreter);
        this.property.defineLabel(this.interpreteText(text, textInterpreter));
        return this;
    }

    protected interpreteText(text: string, textInterpreter?: TextInterpreter) {
        if (textInterpreter !== undefined) {
            const interpreter = this.textInterpreters[textInterpreter];
            return interpreter?.interpreteText(text) ?? text;
        }
        return text;
    }

    protected checkTextInterpreterAvailable(textInterpreter?: TextInterpreter) {
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
    onUpdated(updated: (self: Property) => void): this {
        this.property.registerValueChangedListener({
            updated: () => updated(this.property)
        } as ValueChangeListener);
        return this;
    }

    /**
     * provide a list of other properties that will reset the current property if one of them changed
     * @param resetIfOneOfTheseChanged list with properties that - if changed - will reset the current prop
     */
    setToInitialStateOnOtherPropertyChanged(...otherProperties: AbstractProperty[]): this {
        alwaysAssertThat(!this.property.isReadOnly(), () => `${this.property.id}: Can only set properties to initial value, that are not read only`);
        otherProperties.forEach(prop => prop.registerValueChangedListener({
            updated: () => this.property.setToInitialState()
        }));
        return this;
    }
}
