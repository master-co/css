import { settings as cssLanguageServiceSettings, type Settings as CSSLanguageServiceSettings } from '@master/css-language-service'
import type { Pattern } from 'fast-glob'

const settings: Settings = {
    ...cssLanguageServiceSettings,
    workspaces: 'auto',
    verbose: false,
    diagnoseClassSyntax: false
}

export default settings

export declare type Settings = CSSLanguageServiceSettings & {
    workspaces?: Pattern[] | 'auto'
    verbose?: boolean
    diagnoseClassSyntax?: boolean
}
