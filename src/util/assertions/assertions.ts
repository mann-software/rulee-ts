import { AssertionError } from "./assertion-error";

export function alwaysAssertThat(condition: boolean, text: () => string) {
    if (!condition) {
        throw new AssertionError(getMessage(text));
    }
}

export function assertThat(condition: () => boolean, text: () => string) {
    let assertionFailed = false;
    try {
        assertionFailed = !condition();
    } catch (error) {
        console.error(error);
        throw new AssertionError(`Error while asserting with this message: ${getMessage(text)}`);
    }
    if (assertionFailed) {
        throw new AssertionError(getMessage(text));
    }
}

function getMessage(text: () => string) {
    let message: string;
    try {
        message = text();
    } catch (error) {
        console.log(error);
        message = 'Failed to build the assertion message';
    }
    return message;
}
