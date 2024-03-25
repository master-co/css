import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'
import { getCssEntryMarkdownDescription } from './get-css-entry-markdown-description'
import type { IPropertyData, IValueData } from 'vscode-css-languageservice'

export default function getMainCompletionItems(css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    for (const ruleId in css.config.rules) {
        const eachRule = css.config.rules[ruleId]
        const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === ruleId)
        const documentation = nativeCSSPropertyData ? getCssEntryMarkdownDescription(nativeCSSPropertyData) : ''
        // todo: key alias
        completionItems.push({
            label: ruleId + ':',
            sortText: ruleId,
            kind: CompletionItemKind.Property,
            documentation: documentation ? { kind: 'markdown', value: documentation } : undefined,
            detail: nativeCSSPropertyData ? nativeCSSPropertyData.syntax : undefined,
            command: {
                title: 'triggerSuggest',
                command: 'editor.action.triggerSuggest'
            }
        })
    }

    // todo: test remap semantic to native css property
    if (css.config.semantics) {
        for (const semanticName in css.config.semantics) {
            const declarations = css.config.semantics[semanticName]
            const propsLength = Object.keys(declarations).length
            const propName = Object.keys(declarations)[0] as keyof typeof declarations
            const propValue = declarations[propName]
            let nativeCSSData: IPropertyData | IValueData | undefined
            let detail: string | undefined
            /**
             * Remaps to native CSS properties when only one property is declared
             * */
            if (propsLength === 1) {
                const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === Object.keys(declarations)[0])
                if (semanticName === propValue) {
                    nativeCSSData = nativeCSSPropertyData?.values?.find(({ name }) => name === propValue)
                    detail = `${propName}: ${propValue}`
                } else {
                    nativeCSSData = nativeCSSPropertyData
                    detail = nativeCSSPropertyData?.syntax
                }
            }
            const documentation = nativeCSSData ? getCssEntryMarkdownDescription(nativeCSSData) : ''
            completionItems.push({
                label: semanticName,
                kind: CompletionItemKind.Property,
                documentation: documentation ? { kind: 'markdown', value: documentation } : undefined,
                detail,
            })
        }
    }
    if (css.config.styles) {
        for (const key in css.config.styles) {
            completionItems.push({
                label: key,
                kind: CompletionItemKind.Property
            })
        }
    }
    return completionItems
}