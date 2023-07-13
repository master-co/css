export declare interface Options {
    default?: ThemeValue
    store?: string | false
}

export const options: Options = {
    store: 'theme'
}

export default options

export declare type ThemeValue = 'dark' | 'light' | 'system' | string