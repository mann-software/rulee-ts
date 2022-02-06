import { ValidationResult } from "./validation-result";
import { ValidationType } from "./validation-type";

test('ValidationResult', () => {
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
    });

    expect(result.getAllMessages()).toStrictEqual([errorMsgs1, errorMsgs2, hintMsgs1].flat());
    expect(result.getAllInvalidMessages()).toStrictEqual([errorMsgs1, errorMsgs2].flat());
    expect(result.getAllValidMessages()).toStrictEqual([hintMsgs1].flat());
    expect(result.getAllMessagesOfType(ValidationType.Error)).toStrictEqual([errorMsgs1, errorMsgs2].flat());
    expect(result.getAllMessagesBy(msg => msg.text.endsWith('1'))).toStrictEqual([errorMsgs1, hintMsgs1].flat());
    
    expect(result.getValidationMessagesMap()).toStrictEqual({ errorMsgs1, errorMsgs2, hintMsgs1 });
    expect(result.filterInvalid()).toStrictEqual({ errorMsgs1, errorMsgs2 });
    expect(result.filterValid()).toStrictEqual({ hintMsgs1 });
    expect(result.filterByType(ValidationType.Error)).toStrictEqual({ errorMsgs1, errorMsgs2 });
    expect(result.filterBy(msg => msg.text.endsWith('1'))).toStrictEqual({ errorMsgs1, hintMsgs1 });
});
