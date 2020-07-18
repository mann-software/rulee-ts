
export const valueAfterTime = <T>(value: T, timeMs: number) => {
    return new Promise<T>(resolve => {
        setTimeout(() => resolve(value), timeMs);
    });
}

export const executeAfterTime = <T>(fcn: () => T, timeMs: number) => {
    return new Promise<T>(resolve => {
        setTimeout(() => {
            resolve(fcn());
        }, timeMs);
    });
}
