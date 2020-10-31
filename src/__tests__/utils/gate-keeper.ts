import { AssertionError } from "../../util/assertions/assertion-error";

export class GateKeeper {
    private gate = 0;

    constructor (initialGate = 1) {
        this.gate = initialGate;
    }

    passGate(expectedGate?: number) {
        if (expectedGate !== undefined && expectedGate !== this.gate) {
            throw new AssertionError(`Expected gate is ${expectedGate} but actual gate is ${this.gate}`);
        }
        this.gate++
    }

    failAtCurrentGate() {
        throw new AssertionError(`Failed at gate ${this.gate}`);
    }

    get lastGatePassed() {
        return this.gate - 1;
    }
}