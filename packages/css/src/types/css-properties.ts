import { Properties } from 'csstype'

export type CSSProperties = { [key in keyof Properties]?: Properties[key] }
