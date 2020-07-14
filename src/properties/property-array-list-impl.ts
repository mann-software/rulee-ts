import { PropertyScalarImpl } from "./property-scalar-impl";

export class PropertyArrayList<T> extends PropertyScalarImpl<T[]> {

    pushElements(...el: T[]): void {
        // TODO what about asynchronous value provider?
        const values = this.getValue();
        if (values) {
            values.push(...el);
            this.setValue(values);
        } else {
            this.setValue(el);
        }
    }

    removeElement(el: T): void {

    }
}
