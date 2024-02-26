const settings = {
    calleeMatching: '^(classnames|clsx|ctl|cva|cv|classVariant|styled(?:\\.\\w+)?)',
    classMatching: '^class(Name)?$',
    ignoredKeys: ['compoundVariants', 'defaultVariants'],
    config: 'master.css'
}

export default settings

export interface Settings {
    calleeMatching: string
    classMatching: string
    ignoredKeys: string[]
    config: string | object
}