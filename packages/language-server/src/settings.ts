import cssLanguageServiceSettings, { type Settings as CSSLanguageServiceSettings } from '@master/css-language-service/settings'

const settings: Settings = {
    ...cssLanguageServiceSettings,
    config: 'master.css'
}

export default settings

export declare type Settings = CSSLanguageServiceSettings | { config: string }