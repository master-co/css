import { CompletionItem } from 'vscode-languageserver'
import { masterCssKeyValues } from '../constant'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'

export default function getMainCompletionItems(css: MasterCSS): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    masterCssKeyValues.forEach(x => {
        const fullKey = x.key[0]
        const nativeCSSPropertyData = nativeProperties.find((x: { name: string }) => x.name == fullKey)
        for (const key of x.key) {
            if (!completionItems.find(existedValue => existedValue.label === key + ':')) {
                completionItems.push({
                    label: key + ':',
                    insertTextFormat: 2,
                    sortText: key,
                    kind: 10,
                    documentation: nativeCSSPropertyData?.description ?? '',
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
                label: key + ':',
                kind: 10,
                insertTextFormat: 2,
                command: {
                    title: 'triggerSuggest',
                    command: 'editor.action.triggerSuggest'
                }
            })
        }
    }
    if (css.config.styles) {
        for (const key in css.config.styles) {
            completionItems.push({
                label: key,
                kind: 10,
                insertTextFormat: 2,
                command: {
                    title: 'triggerSuggest',
                    command: 'editor.action.triggerSuggest'
                }
            })
        }
    }
    return completionItems
}