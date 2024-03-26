import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import cssDataProvider from './css-data-provider'
import { MasterCSS, generateCSS } from '@master/css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import type { IPropertyData, IValueData } from 'vscode-css-languageservice'

export default function getMainCompletionItems(css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    for (const ruleId in css.config.rules) {
        const eachRule = css.config.rules[ruleId]
        const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === ruleId)
        // todo: key alias
        completionItems.push({
            label: ruleId + ':',
            sortText: ruleId,
            kind: CompletionItemKind.Property,
            documentation: getCSSDataDocumentation(nativeCSSPropertyData),
            detail: nativeCSSPropertyData?.syntax,
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
            completionItems.push({
                label: semanticName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation(nativeCSSData, {
                    generatedCSS: generateCSS([semanticName], css.customConfig)
                }),
                detail,
            })
        }
    }
    if (css.config.styles) {
        for (const styleName in css.config.styles) {
            completionItems.push({
                label: styleName,
                kind: CompletionItemKind.Property,
                documentation: getCSSDataDocumentation({} as any, {
                    generatedCSS: generateCSS([styleName], css.customConfig)
                }),
                detail: 'style'
            })
        }
    }
    return completionItems
}