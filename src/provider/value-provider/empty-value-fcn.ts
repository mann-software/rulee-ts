import { Choice } from "../../properties/choice";

export type EmptyValueFcn<T> = (value: T | null) => boolean;

export const EmptyValueFcns = {
    DefaultEmptyValueFcn: (val => !val) as EmptyValueFcn<any>,
    NumberEmptyValueFcn: (val => val == null || Number.isNaN(val)) as EmptyValueFcn<number>,
    BooleanEmptyValueFcn: (val => val == null) as EmptyValueFcn<boolean>,
    ChoiceEmptyValueFcn: <T>(emptyChoice: Choice<T>) => (val => val == null || val === emptyChoice.value) as EmptyValueFcn<T>,
}
