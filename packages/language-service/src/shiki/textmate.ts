import masterCSSTextMateGrammar from '../../syntaxes/master-css.tmLanguage.json' with { type: 'json' }

export const MASTER_CSS_SHIKI_SCOPE_NAME = 'master-css.directive.injection'
export const MASTER_CSS_SHIKI_INJECT_TO = [
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
] as const

export interface MasterCSSTextMateGrammar {
    name: string
    scopeName: string
    injectionSelector: string
    patterns: any[]
    repository: Record<string, any>
    [key: string]: any
}

export const MASTER_CSS_TEXTMATE_GRAMMAR = masterCSSTextMateGrammar as MasterCSSTextMateGrammar

export function createMasterCSSShikiLanguageRegistration(): MasterCSSTextMateGrammar & { injectTo: string[] } {
    return {
        ...MASTER_CSS_TEXTMATE_GRAMMAR,
        injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
    }
}

export const masterCSSShikiLanguage = createMasterCSSShikiLanguageRegistration()
