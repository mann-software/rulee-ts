import { DependencyGraph } from "../dependency-graph/dependency-graph";
import { AbstractProperty } from "../properties/abstract-property";
import { RuleEngineUpdateHandler } from "./rule-engine-update-handler-impl";
import { AbstractPropertyWithInternals } from "../properties/abstract-property-impl";
import { ValueChangeListener, ValueChangeListenerReference } from "../properties/value-change-listener";
import { Snapshot } from "./snapshot/snapshot";
import { BuilderOptions } from "./builder/builder-options";
import { Builder } from "./builder/builder";
import { ValidationProcess } from "./validation/validation-process-impl";
import { CrossValidationResult } from "../validators/cross-validation-result";
import { ValidationType } from "../validators/validation-type";
import { CrossValidatorInstance } from "./validation/validator-instance-impl";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { PropertyGroup } from "../properties/group-of-properties";
import { RuleSet } from "./rule-set/rule-set";
import { RuleEngine } from "./rule-engine";
import { ValidationMessagesMap } from "../validators/validation-messages-map";
import { ValidationResult } from "../validators/validation-result";
import { PropertyId } from "../properties/property-id";

export class RuleEngineImpl implements RuleEngine, RuleEngineUpdateHandler {

    private readonly builder: Builder;
    private readonly propertyMap: { [id: PropertyId]: AbstractPropertyWithInternals<unknown> } = {};
    private readonly dependencyGraph = new DependencyGraph();
    private readonly validations = new WeakMap<CrossValidatorInstance<readonly AbstractProperty[]>, ValidationProcess>();

    private readonly dataLinks = new Map<string, [ValueChangeListenerReference, ValueChangeListenerReference]>();
    private readonly snapshots = new Map<string, Snapshot>();

    private get properties() {
        return Object.values(this.propertyMap);
    }

    constructor(options: BuilderOptions) {
        this.builder = new Builder(options, this, this.dependencyGraph, this.propertyMap);
    }

    getBuilder(): Builder {
        return this.builder;
    }

    getPropertyById(id: PropertyId): AbstractDataProperty<unknown> | undefined {
        return this.propertyMap[id];
    }
    
    // -----------------------------------------------------------------------
    
    async validateAllProperties(): Promise<ValidationResult> {
        await Promise.all(Object.values(this.propertyMap).map(prop => prop.validate()));
        return this.getValidationMessages();
    }

    setValidationMessages(validationMessages: ValidationMessagesMap | ValidationResult): PropertyId[] {
        this.clearValidationResult();
        
        const validationMessagesMap: ValidationMessagesMap = validationMessages instanceof ValidationResult 
            ? validationMessages.getValidationMessagesMap() : validationMessages;
        
        const unknownIds: PropertyId[] = [];
        Object.keys(validationMessagesMap).forEach(key => {
            if (this.propertyMap[key] !== undefined) {
                this.propertyMap[key].setValidationMessages(validationMessagesMap[key])
            } else {
                unknownIds.push(key);
            }            
        });
        return  unknownIds;
    }

    getValidationMessages(): ValidationResult {
        const map = Object.keys(this.propertyMap).reduce((res, cur) => {
            const messages = this.propertyMap[cur].getValidationMessages();
            if (messages.length > 0) {
                res[cur] = messages;
            }
            return res;
        }, {} as ValidationMessagesMap);
        return new ValidationResult(map, (id) => this.getPropertyById(id)!);
    }

    clearValidationResult(): void {
        Object.values(this.propertyMap).forEach(prop => prop.clearValidationResult());
    }
    
    // -----------------------------------------------------------------------

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
        const refA = propertyA.registerValueChangedListener(listenerA);
        const refB = propertyB.registerValueChangedListener(listenerB);
        this.dataLinks.set(dataLinkKey, [refA, refB]);
    }

    unlinkPropertyData<D>(propertyA: AbstractDataProperty<D>, propertyB: AbstractDataProperty<D>): void {
        const dataLinkKey = this.createDataLinkKey(propertyA, propertyB);
        const listeners = this.dataLinks.get(dataLinkKey);
        if (listeners) {
            const [refA, refB] = listeners;
            propertyA.deregisterValueChangedListener(refA);
            propertyB.deregisterValueChangedListener(refB);
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
            },
            dependency => !!dependency.options.value
        );
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

    /**
     * Notify other properties that depend on the value of the updated property.
     *
     * Note: Here all dependencies except a value dependency are relevant. E.g. visibility, validation, etc.
     *
     * @param property updated property
     */
    private hasBeenUpdated(property: AbstractPropertyWithInternals<unknown>) {
        property.hasBeenUpdated();
        this.dependencyGraph.traverseDepthFirst(
            property.id,
            (prop, dep) => (prop as AbstractPropertyWithInternals<unknown>).dependencyHasBeenUpdated(dep),
            dependency => !dependency.options.value,
            true
        );
    }

    // -----------------------------------------------------------------------

    cancelValidationAndInvalidateResults(validators: readonly CrossValidatorInstance<readonly AbstractProperty[]>[],): void {
        validators.forEach(v => {
            const vprocess = this.getValidationProcess(v);
            vprocess.isLastResultUpToDate = false;
            vprocess.isCancelled = true;
        });
    }

    validateValidatorInstances(validators: readonly CrossValidatorInstance<readonly AbstractProperty[]>[]): Promise<CrossValidationResult | 'cancelled'>[] {
        return validators.map(validator => {
            const vprocess = this.getValidationProcess(validator);
            if (vprocess.isLastResultUpToDate) {
                return Promise.resolve(vprocess.lastValidationResult);
            } else if(vprocess.currentValidation && !vprocess.isCancelled) {
                return vprocess.currentValidation;
            }
            vprocess.isCancelled = false;
            const validation = validator.validate(...validator.validationArguments);
            if (validation instanceof Promise) {
                vprocess.currentValidation = validation.then(res => {
                    vprocess.currentValidation = undefined;
                    vprocess.lastValidationResult = res;
                    if (vprocess.isCancelled) {
                        return 'cancelled';
                    } else {
                        vprocess.isLastResultUpToDate = true;
                        return res;
                    }
                }, err => {
                    vprocess.currentValidation = undefined;
                    return [{
                        text: JSON.stringify(err),
                        type: ValidationType.ErrorThrownDuringValidation
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

    private getValidationProcess(validator: CrossValidatorInstance<readonly AbstractProperty[]>): ValidationProcess {
        const vprocess = this.validations.get(validator);
        if (vprocess) {
            return vprocess;
        } else {
            const newProcess: ValidationProcess = {
                isLastResultUpToDate: false,
                isCancelled: false,
            }
            this.validations.set(validator, newProcess);
            return newProcess;
        }
    }

    // -----------------------------------------------------------------------

    defineRuleSet<S extends PropertyGroup>(initFcn: (builder: Builder) => S): RuleSet<S> {
        return new RuleSet(initFcn, this.builder);
    }
}
