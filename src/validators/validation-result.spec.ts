import { builderAndRuleEngineFactory } from "../__tests__/utils/test-utils";
import { ValidationResult } from "./validation-result";
import { ValidationType } from "./validation-type";

test('ValidationResult', () => {

    const [builder] = builderAndRuleEngineFactory();

    const errorMsgs1 = [
        { text: 'Some Error 1', type: ValidationType.Error }
    ];
    const errorMsgs2 = [
        { text: 'Some Error 2', type: ValidationType.Error }
    ];
    const hintMsgs1 = [
        { text: 'Some Hint 1', type: ValidationType.Hint }
    ];

    const result = new ValidationResult({
        errorMsgs1,
        errorMsgs2,
        hintMsgs1
    }, (id) => builder.scalar.stringProperty(id));

    expect(result.getValidationMessagesMap()).toStrictEqual({ errorMsgs1, errorMsgs2, hintMsgs1 });

    expect(result.getAllMessages()).toStrictEqual([errorMsgs1, errorMsgs2, hintMsgs1].flat());
    expect(result.isValid()).toBe(false);
    expect(result.isValid()).toBe(false);

    expect(result.getAllMessagesAsStrings((msg, prop) => `${prop.id}: ${msg.text}`))
        .toStrictEqual(['errorMsgs1: Some Error 1', 'errorMsgs2: Some Error 2', 'hintMsgs1: Some Hint 1']);

    expect(result.filterInvalid().getValidationMessagesMap()).toStrictEqual({ errorMsgs1, errorMsgs2 });
    expect(result.filterValid().getValidationMessagesMap()).toStrictEqual({ hintMsgs1 });
    expect(result.filterValid().isValid()).toBe(true);
    expect(result.filterByType(ValidationType.Error).getValidationMessagesMap()).toStrictEqual({ errorMsgs1, errorMsgs2 });
    expect(result.filterBy(msg => msg.text.endsWith('1')).getValidationMessagesMap()).toStrictEqual({ errorMsgs1, hintMsgs1 });
});
