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
    type: Exclude<ConsoleMethod, 'table' | 'group' | 'groupCollapsed' | 'groupEnd' | 'time' | 'timeEnd'>
) => {
    return (message: string, ...args: unknown[]) => {
        if (console[type]) {
            console[type](
                `%cMaster CSS%c ${message}`,
                'color: gray;',
                'color: inherit;',
                ...args
            )
        }
    }
}

const loggers = {
    debug: createLogger('debug'),
    info: createLogger('info'),
    warn: createLogger('warn'),
    error: createLogger('error'),
    trace: createLogger('trace'),
    table: console.table,
    group: console.group,
    groupCollapsed: console.group,
    groupEnd: console.groupEnd,
    time: console.time,
    timeEnd: console.timeEnd
}

const log = createLogger('log') as ReturnType<typeof createLogger> & typeof loggers

Object.assign(log, loggers)

export default log