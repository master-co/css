import { CLASS_ATTRIBUTES, CLASS_DECLARATIONS, CLASS_FUNCTIONS } from '@master/css'
import type { Config } from 'shared/css-config'

const settings = {
    classAttributes: CLASS_ATTRIBUTES,
    classFunctions: CLASS_FUNCTIONS,
    classDeclarations: CLASS_DECLARATIONS,
    ignoredKeys: ['compoundVariants', 'defaultVariants'],
    config: undefined
}

export default settings

export interface Settings {
    classAttributes?: string[]
    classFunctions?: string[]
    classDeclarations?: string[]
    ignoredKeys: string[]
    config?: Config
}
