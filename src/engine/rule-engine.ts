import { DependencyGraph } from "../dependency-graph/dependency-graph";
import { AbstractProperty } from "../properties/abstract-property";
import { RuleEngineUpdateHandler } from "./rule-engine-update-handler-impl";
import { AbstractPropertyWithInternals } from "../properties/abstract-property-impl";
import { ValueChangeListener } from "../properties/value-change-listener";
import { Snapshot } from "./snapshot/snapshot";
import { BuilderOptions } from "./builder/builder-options";
import { Builder } from "./builder/builder";
import { ValidationProcess } from "./validation/validation-process-impl";
import { ValidationResult } from "../validators/validation-result";
import { ValidationTypes } from "../validators/validation-type";
import { ValidatorInstance } from "./validation/validator-instance-impl";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { PropertyGroup } from "../properties/group-of-properties";
import { RuleSet } from "./rule-set/rule-set";

export class RuleEngine implements RuleEngineUpdateHandler {

    private readonly builder: Builder;
    private readonly propertyMap: { [id: string]: AbstractPropertyWithInternals<unknown> } = {};
    private readonly dependencyGraph = new DependencyGraph();
    private readonly validations = new WeakMap<ValidatorInstance<readonly AbstractProperty[]>, ValidationProcess>();

    private readonly dataLinks = new Map<string, [ValueChangeListener, ValueChangeListener]>();
    private readonly snapshots = new Map<string, Snapshot>();
    private propertiesThatRequireAnEagerUpdate: AbstractProperty[] = [];

    private get properties() {
        return Object.values(this.propertyMap);
    }

    /**
     * Creates a rule engine for your business rules
     * @param options for the builder
     */
    constructor(options: BuilderOptions) {
        this.builder = new Builder(options, this, this.dependencyGraph, this.propertyMap);
    }

    /**
     * Creates a rule set that is indended to bundle a larger number of properties.
     * The properties are initialized lazy. This helps the boot time of your app by
     * loading larger parts as soon as they are needed on a page.
     */
    defineRuleSet<S extends PropertyGroup>(initFcn: (builder: Builder) => S): RuleSet<S> {
        return new RuleSet(initFcn, this.builder);
    }

    /**
     * Returns the Builder to define new properties.
     * The preferred way is to define modules via defineModule().
     */
    getBuilder(): Builder {
        return this.builder;
    }

    /**
     * Returns the property for the given id. However, the preferred way is to 
     * create a module and access the property via RuleSet.getProperties(). This
     * ensures that the property exists.
     * @param id of the property
     */
    getPropertyById(id: string): AbstractProperty | undefined {
        return this.propertyMap[id];
    }

    takeSnapShot(key = 'default'): Snapshot {
        const snap = {
            key,
            data: this.properties.map(p => p.exportData())
        } as Snapshot;
        this.snapshots.set(key, snap);
        return snap;
    }

    restoreSnapShot(key = 'default'): void {
        const snap = this.snapshots.get(key);
        if (snap) {
            snap.data.forEach((d: unknown, i: number) => this.properties[i].importData(d))
        }
    }
    
    // -----------------------------------------------------------------------

    /**
     * The data of the properties will be synchonized. (Via AbstractDataProperty)
     * Usefull on UI if there is a list and one element of the list should be
     * edited. Then you can synchronise the properties that are used for editing
     * and the list element property that should be edited.
     * 
     * Only the data will be synchronized, the Attributes (i.e. visibility and so on)
     * that are derived from this data can be handled independently
     * 
     * @param propertyA property to synchronize
     * @param propertyB property to synchronize
     */
    linkPropertyData<D>(propertyA: AbstractDataProperty<D>, propertyB: AbstractDataProperty<D>): void {
        const dataLinkKey = this.createDataLinkKey(propertyA, propertyB);
        if (this.dataLinks.has(dataLinkKey)) {
            return;
        }
        const listenerA = {
            updated: () => propertyA.transferData(propertyB)
        } as ValueChangeListener;
        const listenerB = {
            updated: () => propertyB.transferData(propertyA)
        } as ValueChangeListener;
        propertyA.transferData(propertyB);
        propertyA.registerValueChangedListener(listenerA);
        propertyB.registerValueChangedListener(listenerB);
        this.dataLinks.set(dataLinkKey, [listenerA, listenerB]);
    }

    /**
     * This will stop the synchronizing of the property
     * @param propertyA synchronized property
     * @param propertyB synchronized property
     */
    unlinkPropertyData<D>(propertyA: AbstractDataProperty<D>, propertyB: AbstractDataProperty<D>): void {
        const dataLinkKey = this.createDataLinkKey(propertyA, propertyB);
        const listeners = this.dataLinks.get(dataLinkKey);
        if (listeners) {
            const [listenerA, listenerB] = listeners;
            propertyA.deregisterValueChangedListener(listenerA);
            propertyB.deregisterValueChangedListener(listenerB);
            this.dataLinks.delete(dataLinkKey);
        }
    }

    private createDataLinkKey(propertyA: AbstractProperty, propertyB: AbstractProperty) {
        return propertyA.id < propertyB.id
            ? `${propertyA.id}<->${propertyB.id}`
            : `${propertyB.id}<->${propertyA.id}`;
    }

    // -----------------------------------------------------------------------

    needsAnUpdate(mightHaveChanged: AbstractProperty): void {
        this.dependencyGraph.traverseDepthFirst(
            mightHaveChanged.id, 
            property => {
                property.needsAnUpdate(false);
                if ((property as AbstractPropertyWithInternals<unknown>).internallyRequiresEagerUpdate()
                    && this.propertiesThatRequireAnEagerUpdate.every(p => p.id !== property.id)
                ) {
                    this.propertiesThatRequireAnEagerUpdate.push(property);
                }
            },
            dependency => !!dependency.options.value
        );
        setTimeout(() => {
            const eagerProps = this.propertiesThatRequireAnEagerUpdate;
            this.propertiesThatRequireAnEagerUpdate = [];
            eagerProps.forEach((prop: AbstractProperty) => void this.updateValue(prop));
        }, 0);
    }

    updateValue(property: AbstractProperty): Promise<void> | undefined {
        const asyncUpdates = this.dependencyGraph.getAsyncDependencies(property.id)
            ?.map(asyncDep => this.updateValue(asyncDep));
        if (asyncUpdates?.length && asyncUpdates.some(update => !!update)) {
            return Promise.all(asyncUpdates).then(() => 
                this.updateValueInternal(property as AbstractPropertyWithInternals<unknown>)
            ).catch((err) => {
                (property as AbstractPropertyWithInternals<unknown>).errorWhileUpdating(err);
            });
        } else {
            return this.updateValueInternal(property as AbstractPropertyWithInternals<unknown>);
        }
    }
    
    private updateValueInternal(property: AbstractPropertyWithInternals<unknown>): Promise<void> | undefined {
        try {
            const updatePromise = property.internallyUpdate();
            if (updatePromise) {
                return updatePromise.then(() => {
                    this.hasBeenUpdated(property);
                }).catch(err => property.errorWhileUpdating(err));
            } else {
                this.hasBeenUpdated(property);
            }
        } catch (err) {
            property.errorWhileUpdating(err);
        }
    }

    hasBeenUpdated(property: AbstractPropertyWithInternals<unknown>) { // TODO hide from public interface
        property.hasBeenUpdated();
        this.dependencyGraph.traverseDepthFirst(
            property.id,
            (prop, dep) => (prop as AbstractPropertyWithInternals<unknown>).dependencyHasBeenUpdated(dep),
            dependency => !dependency.options.value,
            true
        );
    }

    // -----------------------------------------------------------------------

    invalidateValidationResults(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): void {
        validators.forEach(v => {
            const vprocess = this.getValidationProcess(v);
            vprocess.isLastResultUpToDate = false;
        });
    }

    validate(validators: readonly ValidatorInstance<readonly AbstractProperty[]>[]): Promise<ValidationResult>[] {
        return validators.map(validator => {
            const vprocess = this.getValidationProcess(validator);
            if (vprocess.isLastResultUpToDate) {
                return Promise.resolve(vprocess.lastValidationResult);
            } else if(vprocess.currentValidation) {
                return vprocess.currentValidation;
            }
            const validation = validator.validate(...validator.getValidatedProperties());
            if (validation instanceof Promise) {
                vprocess.currentValidation = validation.then(res => {
                    vprocess.currentValidation = undefined;
                    vprocess.lastValidationResult = res;
                    vprocess.isLastResultUpToDate = true;
                    return res;
                }, err => {
                    vprocess.currentValidation = undefined;
                    return [{
                        text: JSON.stringify(err),
                        type: ValidationTypes.ErrorThrownDuringValidation
                    }];
                });
                return vprocess.currentValidation;
            } else {
                vprocess.lastValidationResult = validation;
                vprocess.isLastResultUpToDate = true;
                return Promise.resolve(validation);
            }
        });
    }

    private getValidationProcess(validator: ValidatorInstance<readonly AbstractProperty[]>): ValidationProcess {
        const vprocess = this.validations.get(validator);
        if (vprocess) {
            return vprocess;
        } else {
            const newProcess: ValidationProcess = {
                isLastResultUpToDate: false
            }
            this.validations.set(validator, newProcess);
            return newProcess;
        }
    }

}
