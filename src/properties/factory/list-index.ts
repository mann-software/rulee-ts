
/**
 * Parameter for all kinds of ListPropertyTemplate
 */
export interface ListIndex {
    readonly idx: number;
    isFirst(): boolean;
    isLast(): boolean;
    isSelected(): boolean;
}
