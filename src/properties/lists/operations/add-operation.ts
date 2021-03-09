import { ListOperation } from "./operation";

export class AddOperation<T> implements ListOperation<T> {

    constructor(
        public sync: Promise<void> | void,
        private readonly element: T,
        private index?: number,
    ) {}
    
    apply(list: T[]): void {
        if (this.index !== undefined) {
            list.splice(this.index, 0, this.element);
        } else {
            this.index = list.length;
            list.push(this.element);
        }
    }

    undo(list: T[]): void {
        if (this.index) {
            list.splice(this.index, 1);
        }
    }

}
