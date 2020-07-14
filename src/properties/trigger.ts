import { Logger } from "../util/logger/logger";

export interface TriggerListener {
    onTriggered(): Promise<void>;
}

export class Trigger {

    constructor(public label?: string) { }

    private listeners: TriggerListener[] = [];

    trigger(): Promise<void> {
        return Promise.all(this.listeners.map(listener => listener.onTriggered())).then(() => {
            return;
        });
    }

    registerTriggerListener(listener: TriggerListener): void {
        if (!this.listeners.find(l => l === listener)) {
            this.listeners.push(listener);
        } else {
            Logger.debug('Tigger.registerTriggerListener: listener already registered');
        }
    }

    deregisterTriggerListener(listener: TriggerListener): void {
        const idx = this.listeners.findIndex(l => l === listener);
        if (idx >= 0) {
            this.listeners.splice(idx, 1);
        } else {
            Logger.debug('Tigger.deregisterTriggerListener: listener was not registered');
        }
    }
}
