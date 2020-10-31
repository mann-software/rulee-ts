import { Builder } from "../engine/builder/builder";
import { Choice } from "../properties/choice";
import { builderAndRuleEngineFactory } from "./utils/test-utils";
import { valueAfterTime } from "./utils/timing-utils";

interface TestDTO {
    id: number;
    name: string;
}

const freddie: Choice<TestDTO> = { value: { id: 0, name: 'Freddie' }, displayValue: 'Freddie (0)'};
const eduard: Choice<TestDTO> = { value: { id: 1, name: 'Eduard' }, displayValue: 'Eduard (1)'};

let builder: Builder;

beforeEach(() => {
    [builder] = builderAndRuleEngineFactory();
});

test('async derived property typeahead', async () => {
    const propA = builder.scalar.typeahead.async('PROP_A', {
        fetchChoices: (currentText) => valueAfterTime<Choice<TestDTO>[]>(
            [freddie, eduard].filter(choice => !currentText || choice.displayValue.toLowerCase().includes(currentText.toLowerCase())), 
            10
        )
    });

    expect(propA.getValue()).toStrictEqual([null, '']);
    expect(propA.getChoices()).toStrictEqual([]);

    propA.setDisplayValue('ed');
    expect(propA.getValue()).toStrictEqual([null, 'ed']);
    expect(propA.getChoices()).toStrictEqual([]);

    expect(propA.isProcessing()).toBe(false);
    const choices = propA.awaitChoices();
    expect(propA.isProcessing()).toBe(true);
    await choices;
    expect(propA.isProcessing()).toBe(false);
    expect(propA.getValue()).toStrictEqual([null, 'ed']);
    expect(propA.getChoices()).toStrictEqual([freddie, eduard]);

    propA.setDisplayValue('edu');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([null, 'edu']);
    expect(propA.getChoices()).toStrictEqual([eduard]);

    propA.setDisplayValue('Freddie (0)');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([freddie.value, 'Freddie (0)']);
    expect(propA.getChoices()).toStrictEqual([freddie]);

    propA.setDisplayValue('ja');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([null, 'ja']);
    expect(propA.getChoices()).toStrictEqual([]);

    propA.setDisplayValue('');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([null, '']);
    expect(propA.getChoices()).toStrictEqual([freddie, eduard]);

    propA.setValue([eduard.value, '']);
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([eduard.value, 'Eduard (1)']);
    expect(propA.getChoices()).toStrictEqual([eduard]);
});

test('async derived property typeahead with minimum input length', async () => {
    const propA = builder.scalar.typeahead.async<TestDTO>('PROP_A', {
        fetchChoices: (currentText) => valueAfterTime(
            [freddie, eduard].filter(choice => !currentText || choice.displayValue.toLowerCase().includes(currentText.toLowerCase())), 
            10
        ),
        minimumTextLength: 2,
    });

    propA.setDisplayValue('e');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([null, 'e']);
    expect(propA.getChoices()).toStrictEqual([]);

    propA.setDisplayValue('ed');
    await propA.awaitChoices();
    expect(propA.getValue()).toStrictEqual([null, 'ed']);
    expect(propA.getChoices()).toStrictEqual([freddie, eduard]);
});

