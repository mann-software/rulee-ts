
export class SingleSelection {
    
    idx?: number;

    swapProperties(indexA: number, indexB: number): void {
        if (this.idx === indexA) {
            this.idx = indexB;
        } else if (this.idx === indexB) {
            this.idx = indexA;
        }
    }

    moveProperty(fromIndex: number, toIndex: number): void {
        if (this.idx !== undefined) {
            if (this.idx === fromIndex) {
                this.idx = toIndex;
            } else if (this.idx > fromIndex && this.idx <= toIndex) {
                this.idx--;
            } else if (this.idx < fromIndex && this.idx >= toIndex) {
                this.idx++;
            }
        }
    }

    removePropertyAtIndex(index: number): void {
        if (this.idx !== undefined) {
            if (this.idx === index) {
                this.idx = undefined;
            } else if (this.idx > index) {
                this.idx--;
            }
        }
    }
}
