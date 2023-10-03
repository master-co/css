import { PropertiesHyphen } from 'csstype'

export type CSSDeclarations = { [key in keyof PropertiesHyphen]?: PropertiesHyphen[key] }
