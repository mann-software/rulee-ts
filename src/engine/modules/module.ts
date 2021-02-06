import { Builder } from "../builder/builder";
import { PropertyGroup } from "../../properties/group-of-properties";

/**
 * Module are indended to bundle a larger number of properties.
 * The properties are initialized lazy. This helps the boot time of your app by
 * loading larger parts as soon as they are needed on a page.
 */
export class Module<S extends PropertyGroup> {

    private scope?: S;

    constructor(
        private readonly initFcn: (builder: Builder) => S,
        private readonly builder: Builder
    ) { }

    getProperties(): S {
        if (!this.scope) {
            this.scope = this.initFcn(this.builder);
        }
        return this.scope;
    }

}
