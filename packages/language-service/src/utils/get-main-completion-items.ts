import { CompletionItem } from 'vscode-languageserver'
import { masterCssKeyValues } from '../constant'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'
import { getCssEntryMarkdownDescription } from './get-css-entry-markdown-description'

export default function getMainCompletionItems(css: MasterCSS): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    masterCssKeyValues.forEach(x => {
        const fullKey = x.key[0]
        const nativeCSSPropertyData = nativeProperties.find((x: { name: string }) => x.name == fullKey)
        const documentation = nativeCSSPropertyData ? getCssEntryMarkdownDescription(nativeCSSPropertyData) : ''
        for (const key of x.key) {
            if (!completionItems.find(existedValue => existedValue.label === key + ':')) {
                completionItems.push({
                    label: key + ':',
                    sortText: key,
                    kind: 10,
                    documentation: documentation ? {
                        kind: 'markdown',
                        value: documentation
                    } : undefined,
                    detail: nativeCSSPropertyData ? nativeCSSPropertyData.syntax : undefined,
                    command: {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                })
            }
        }
    })
    if (css.config.semantics) {
        for (const key in css.config.semantics) {
            completionItems.push({
                label: key,
                kind: 10
            })
        }
    }
    if (css.config.styles) {
        for (const key in css.config.styles) {
            completionItems.push({
                label: key,
                kind: 10
            })
        }
    }
    return completionItems
}