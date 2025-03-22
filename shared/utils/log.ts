type ConsoleMethod =
    | 'log'
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'trace'
    | 'table'
    | 'group'
    | 'groupCollapsed'
    | 'groupEnd'
    | 'time'
    | 'timeEnd';

const createLogger = (
    type?: Exclude<ConsoleMethod, 'table' | 'group' | 'groupCollapsed' | 'groupEnd' | 'time' | 'timeEnd'>
) => {
    return (message: string, ...args: unknown[]) => {
        if (!type) return console.log(message, ...args)
        if (console[type]) {
            console[type](
                `%c[Master CSS]%c ${message}`,
                'color: gray;',
                'color: inherit;',
                ...args
            )
        }
    }
}

const loggers = {
    info: createLogger('info'),
    debug: createLogger('debug'),
    warn: console.warn,
    error: console.error,
    trace: console.trace,
    table: console.table,
    group: console.group,
    groupCollapsed: console.group,
    groupEnd: console.groupEnd,
    time: console.time,
    timeEnd: console.timeEnd
}

const log = createLogger() as ReturnType<typeof createLogger> & typeof loggers

Object.assign(log, loggers)

export default log