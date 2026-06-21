import { CLASS_ATTRIBUTES, CLASS_DECLARATIONS, CLASS_FUNCTIONS } from './master-css'
import type { ClassPositionSettings } from './utils/get-class-positions'
import type { MasterCSSPlan } from 'shared/master-css-plan'

const languageSettings: LanguageSettings = {
    classAttributes: CLASS_ATTRIBUTES,
    classAttributeBindings: {
        "className": ["{", "}"],
        "class": ["{", "}"],
        "class:list": ["{", "}"],
        ":class": ["\"", "\""],
        "v-bind:class": ["\"", "\""],
        "[class]": ["\"", "\""],
        "[className]": ["\"", "\""],
        "[ngClass]": ["\"", "\""]
    },
    classDeclarations: CLASS_DECLARATIONS,
    classFunctions: CLASS_FUNCTIONS,
    embeddedSyntaxHighlighting: 'active'
}

export default languageSettings

export interface LanguageSettings extends ClassPositionSettings {
    plan?: MasterCSSPlan
    embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
}
