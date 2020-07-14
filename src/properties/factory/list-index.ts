
/**
 * Parameter for all kinds of ListPropertyTemplate
 */
export interface ListIndex {
    idx(): number;
    isFirst(): boolean;
    isLast(): boolean;
    isSelected(): boolean;
}
