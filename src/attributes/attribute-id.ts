
export interface AttributeId<A> { // A needed for type safety
    name: string;
}

export const Mandatory = { name: 'Mandatory' } as AttributeId<boolean>;
export const Visible = { name: 'Visible' } as AttributeId<boolean>;
export const Label = { name: 'Label' } as AttributeId<string>;
export const InfoText = { name: 'InfoText' } as AttributeId<string>;

// Important: If this is changed, also change defineAttributeFunction!
export const A = {
    Mandatory,
    Visible,
    Label,
    InfoText
};
