import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import cssDataProvider from './css-data-provider'
import { MasterCSS, generateCSS } from '@master/css'
import { getCSSDataDocumentation } from './get-css-data-documentation'

export default function getValueCompletionItems(key: string, css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    const nativeCSSPropertyData = nativeProperties.find((x: { name: string }) => x.name === key)
    if (!nativeCSSPropertyData) return completionItems
    nativeCSSPropertyData.values?.forEach(value => {
        completionItems.push({
            label: value.name,
            kind: CompletionItemKind.Value,
            sortText: value.name.startsWith('-')
                ? 'zz' + value.name.slice(1)
                : value.name,
            documentation: getCSSDataDocumentation(value, {
                generatedCSS: generateCSS([key + ':' + value.name], css.customConfig)
            }),
            detail: key + ': ' + value.name
        })
    })
    return completionItems
}