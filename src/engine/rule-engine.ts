import { DependencyGraph } from "../dependency-graph/dependency-graph";
import { RuleEngineDescription } from "./rule-engine-description";
import { AbstractProperty } from "../properties/abstract-property";
import { RuleEngineUpdateHandler } from "./rule-engine-update-handler";
import { AbstractPropertyWithInternals } from "../properties/abstract-property-impl";
import { ValueChangeListener } from "../properties/value-change-listener";
import { Snapshot } from "./snapshot/snapshot";
import { Logger } from "../util/logger/logger";

export class RuleEngine implements RuleEngineUpdateHandler<unknown> {

    private readonly dataLinks = new Map<string, [ValueChangeListener, ValueChangeListener]>();
    private readonly snapshots = new Map<string, Snapshot>();
    private propertiesThatRequireAnEagerUpdate: AbstractProperty<unknown>[] = [];

    private get properties() {
        return Object.values(this.propertyMap);
    }
    
    constructor (private readonly dependencyGraph: DependencyGraph, private readonly propertyMap: { [id: string]: AbstractPropertyWithInternals<unknown> }) {}

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
     * The data of the properties will be synchonized. (Via DataLink)
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
    linkPropertyData<D>(propertyA: AbstractProperty<D>, propertyB: AbstractProperty<D>): void {
        const dataLinkKey = this.createDataLinkKey(propertyA, propertyB);
        if (this.dataLinks.has(dataLinkKey)) {
            return;
        }
        const listenerA = {
            updated: () => this.transferData(propertyA, propertyB)
        } as ValueChangeListener;
        const listenerB = {
            updated: () => this.transferData(propertyB, propertyA)
        } as ValueChangeListener;
        this.transferData(propertyA, propertyB);
        propertyA.registerValueChangedListener(listenerA);
        propertyB.registerValueChangedListener(listenerB);
        this.dataLinks.set(dataLinkKey, [listenerA, listenerB]);
    }

    /**
     * This will stop the synchronizing of the property
     * @param propertyA synchronized property
     * @param propertyB synchronized property
     */
    unlinkPropertyData<D>(propertyA: AbstractProperty<D>, propertyB: AbstractProperty<D>): void {
        const dataLinkKey = this.createDataLinkKey(propertyA, propertyB);
        const listeners = this.dataLinks.get(dataLinkKey);
        if (listeners) {
            const [listenerA, listenerB] = listeners;
            propertyA.deregisterValueChangedListener(listenerA);
            propertyB.deregisterValueChangedListener(listenerB);
            this.dataLinks.delete(dataLinkKey);
        }
    }

    private createDataLinkKey<D>(propertyA: AbstractProperty<D>, propertyB: AbstractProperty<D>) {
        return propertyA.id < propertyB.id
            ? `${propertyA.id}<->${propertyB.id}`
            : `${propertyB.id}<->${propertyA.id}`;
    }

    transferData<D>(fromProperty: AbstractProperty<D>, toProperty: AbstractProperty<D>): void {
        toProperty.importData(fromProperty.exportData());
    }

    // -----------------------------------------------------------------------

    needsAnUpdate(mightHaveChanged: AbstractProperty<unknown>): void {
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
            eagerProps.forEach((prop: AbstractProperty<unknown>) => void this.updateValue(prop));
        });
    }

    updateValue(property: AbstractProperty<unknown>): Promise<void> {
        const asyncDeps = this.dependencyGraph.getAsyncDependencies(property.id);
        if (asyncDeps?.length) {
            return Promise.all(asyncDeps.map(pd => this.updateValue(pd.from)))
                .then(() => (property as AbstractPropertyWithInternals<unknown>).internallyUpdate())
                .then(() => this.hasBeenUpdated(property as AbstractPropertyWithInternals<unknown>))
                .catch(e => Logger.error(`Error updating ${property.id}: `, e));
        } else {
            return (property as AbstractPropertyWithInternals<unknown>).internallyUpdate()
                .then(() => this.hasBeenUpdated(property as AbstractPropertyWithInternals<unknown>))
                .catch(e => Logger.error(`Error updating ${property.id}`, e));
        }
    }

    private hasBeenUpdated(property: AbstractPropertyWithInternals<unknown>) {
        property.hasBeenUpdated();
        this.dependencyGraph.traverseDepthFirst(
            property.id,
            (prop, dep) => (prop as AbstractPropertyWithInternals<unknown>).dependencyHasBeenUpdated(dep),
            dependency => !dependency.options.value
        );
    }

    static serialize(engine: RuleEngine): string {
        // TODO
        return '';
    }

    static deserialize(serialized: string): RuleEngine {
        // TODO
        // - possible to send rule engine via network
        // - faster creation since serialized rule engine needs no preprocessing (e.g. analysing graph)
        // - maybe validation if serialized string is valid for security reasons? 
        //   -> attacker could manipulate values. E.g. for IBAN display value as entered but internal value its the attackers IBAN
        //      -> thus validation no gain for security.
        //      -> prossibly code injection via serialized rule engine!
        //      -> serialized string needs to be signed by cryto mechanism!
        const description = JSON.parse(serialized);
        return RuleEngine.createFromRuleEngineDescription(description);
    }
    
    static createFromRuleEngineDescription(description: RuleEngineDescription): RuleEngine {
        // TODO
        throw Error('TODO');
    }
}
