import { AbstractProperty } from "../properties/abstract-property";
import { Snapshot } from "./snapshot/snapshot";
import { Builder } from "./builder/builder";
import { PropertyGroup } from "../properties/group-of-properties";
import { RuleSet } from "./rule-set/rule-set";
import { BuilderOptions } from "./builder/builder-options";
import { AbstractDataProperty } from "../properties/abstract-data-property";
import { RuleEngineImpl } from "./rule-engine-impl";
import { PropertyId } from "../properties/property-id";
import { ValidationMessagesMap } from "../validators/validation-messages-map";
import { ValidationResult } from "../validators/validation-result";
import { RuleEngineData } from "./data/rule-engine-data";
import { RulesVersion } from "./data/rules-version";

export function createRuleEngine(options: BuilderOptions) {
    return new RuleEngineImpl(options);
}

export interface RuleEngine {

    /**
     * Returns the version of the defined rules
     */
    getVersion(): RulesVersion;

    /**
     * Returns the Builder to define new properties.
     * The preferred way is to define modules via defineModule().
     */
    getBuilder(): Builder;

    /**
     * Returns the property for the given id. However, the preferred way is to 
     * create a module and access the property via RuleSet.getProperties(). This
     * ensures that the property exists.
     * @param id of the property
     */
    getPropertyById(id: PropertyId): AbstractProperty | undefined;
    
    // -----------------------------------------------------------------------

    /**
     * Validates all the properties and returns all validation messages that are issued
     */
    validate(): Promise<ValidationResult>;

    /**
     * Clears all validation messages and sets the given messages
     * @param validationMessagesMap messages
     * @returns unknown property ids
     */
    setValidationMessages(validationMessages: ValidationMessagesMap | ValidationResult): PropertyId[];

    /**
     * Returns all the validation messages that are present
     */
    getValidationMessages(): ValidationResult;

    /**
     * Clears all the validation messages and all properties are considered as valid.
     * Ongoing validations are cancelled as well.
     */
     clearValidationResult(): void;
    
    // -----------------------------------------------------------------------

    /**
     * 
     * @param onlySelectedProperties if provided, only these properties will be exported
     */
    exportData(onlySelectedProperties?: PropertyId[]): RuleEngineData;

    /**
     * Imports the data. A version compatibility check according to the current {@link RulesVersion} is performed beforehand.
     * Before the actual import the rule engine is set to initial state, meaning: if only selected properties were exported,
     * then all other properties are in the initial state.
     * 
     * @param data data to import
     */
    importData(data: RuleEngineData): void;

    /**
     * (Re-)sets the rule engines data to the initial state
     */
    setToInitialState(): void;

    /**
     * Save a snapshot of the current rule engines state. It is stored in the RAM.
     * @param key key used to store multiple snapshots
     */
    takeSnapShot(key?: string): Snapshot;

    /**
     * restores the state of the rule engine for the given snapshot
     * @param key snapshot key
     */
    restoreSnapShot(key?: string): void;
    
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
    linkPropertyData<D>(propertyA: AbstractDataProperty<D>, propertyB: AbstractDataProperty<D>): void;

    /**
     * This will stop the synchronizing of the property
     * @param propertyA synchronized property
     * @param propertyB synchronized property
     */
    unlinkPropertyData<D>(propertyA: AbstractDataProperty<D>, propertyB: AbstractDataProperty<D>): void;

    // -----------------------------------------------------------------------

    /**
     * Call this, if the property might have changed.
     * The rule engine will mark all properties that are necessary to be updated
     * @param mightHaveChanged property that might have changed
     */
    needsAnUpdate(mightHaveChanged: AbstractProperty): void;

    // -----------------------------------------------------------------------
    
    /**
     * Creates a rule set that is indended to bundle a larger number of properties.
     * The properties are initialized lazy. This helps the boot time of your app by
     * loading larger parts as soon as they are needed on a page.
     */
     defineRuleSet<S extends PropertyGroup>(initFcn: (builder: Builder) => S): RuleSet<S>;

}
