
export class LoggerInstance {
    
    static readonly TRACE = 1;
    static readonly DEBUG = 2;
    static readonly INFO = 3;
    static readonly WARN = 4;
    static readonly ERROR = 5;
    static readonly NONE = 6;
    
    logLevel = LoggerInstance.DEBUG;

    log(msg: any | (() => any), level: number, optionalParams?: any[]) {
        if (this.logLevel <= level) {
            if (msg instanceof Function) {
                msg = msg();
            }
            if (msg instanceof Object || msg instanceof Array) {
                msg = JSON.stringify(msg);
            }
            if (optionalParams?.length) {
                console.log(msg, ...optionalParams);
            } else {
                console.log(msg);
            }
        }
    }

    trace(msg: any | (() => any)) {
        this.log(msg, LoggerInstance.TRACE);
    }

    debug(msg: any | (() => any)) {
        this.log(msg, LoggerInstance.DEBUG);
    }

    info(msg: any | (() => any)) {
        this.log(msg, LoggerInstance.INFO);
    }

    warn(msg: any | (() => any)) {
        this.log(msg, LoggerInstance.WARN);
    }

    error(msg: any | (() => any), error?: any) {
        this.log(msg, LoggerInstance.ERROR, error);
    }
}

export const Logger = new LoggerInstance();
