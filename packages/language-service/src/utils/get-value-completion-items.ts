import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'
import { getCssEntryMarkdownDescription } from './get-css-entry-markdown-description'

export default function getValueCompletionItems(key: string, css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    const nativeCSSPropertyData = nativeProperties.find((x: { name: string }) => x.name === key)
    if (!nativeCSSPropertyData) return completionItems
    nativeCSSPropertyData.values?.forEach(value => {
        const documentation = getCssEntryMarkdownDescription(value)
        completionItems.push({
            label: value.name,
            kind: CompletionItemKind.Value,
            documentation: documentation ? {
                kind: 'markdown',
                value: documentation
            } : undefined,
            detail: key + ': ' + value.name
        })
    })
    return completionItems
}