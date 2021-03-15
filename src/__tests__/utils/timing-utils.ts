
export const valueAfterTime = <T>(value: T, timeMs: number) => {
    return new Promise<T>(resolve => {
        setTimeout(() => resolve(value), timeMs);
    });
}

export const executeAfterTime = <T>(exe: (() => T) | Promise<T>, timeMs: number) => {
    return new Promise<T>((resolve, reject) => {
        try {
            setTimeout(() => {
                if (exe instanceof Promise) {
                    void exe.then(val => resolve(val)).catch(err => reject(err));
                } else {
                    try {
                        resolve(exe());
                    } catch (err) {
                        reject(err);
                    }
                }
            }, timeMs);
        } catch (err) {
            console.error('executeAfterTime', err);
            reject(err);
        }
    });
}
