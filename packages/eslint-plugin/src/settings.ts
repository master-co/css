import { CLASS_ATTRIBUTES, CLASS_DECLARATIONS, CLASS_FUNCTIONS, type MasterCSSManifest } from './utils/master-css'

const settings = {
    classAttributes: CLASS_ATTRIBUTES,
    classFunctions: CLASS_FUNCTIONS,
    classDeclarations: CLASS_DECLARATIONS,
    ignoredKeys: ['compoundVariants', 'defaultVariants'],
    manifest: undefined
}

export default settings

export interface Settings {
    classAttributes?: string[]
    classFunctions?: string[]
    classDeclarations?: string[]
    ignoredKeys: string[]
    manifest?: MasterCSSManifest
}
