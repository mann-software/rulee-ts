import { Choice } from "../properties/choice";

export type EmptyValueFcn<T> = (value: T | null) => boolean;

export const EmptyValueFcns = {
    defaultEmptyValueFcn: (val => !val) as EmptyValueFcn<unknown>,
    numberEmptyValueFcn: (val => val == null || Number.isNaN(val)) as EmptyValueFcn<number>,
    booleanEmptyValueFcn: (val => val == null) as EmptyValueFcn<boolean>,
    choiceEmptyValueFcn: <T>(emptyChoice: Choice<T>) => (val => val == null || val === emptyChoice.value) as EmptyValueFcn<T>,
    arrayEmptyValueFcn: (val => val == null || val.length === 0) as EmptyValueFcn<unknown[]>,
}
