import { CLASS_ATTRIBUTES, CLASS_DECLARATIONS, CLASS_FUNCTIONS, type MasterCSSPlan } from './utils/master-css'

const settings = {
    classAttributes: CLASS_ATTRIBUTES,
    classFunctions: CLASS_FUNCTIONS,
    classDeclarations: CLASS_DECLARATIONS,
    ignoredKeys: ['compoundVariants', 'defaultVariants'],
    plan: undefined
}

export default settings

export interface Settings {
    classAttributes?: string[]
    classFunctions?: string[]
    classDeclarations?: string[]
    ignoredKeys: string[]
    plan?: MasterCSSPlan
}
