import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import cssDataProvider from './css-data-provider'
import { MasterCSS, generateCSS } from '@master/css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import type { IPropertyData, IValueData } from 'vscode-css-languageservice'

export default function getMainCompletionItems(css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    process.env.VSCODE_IPC_HOOK && console.time('getMainCompletionItems')
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

    // todo: test remap utility to native css property
    if (css.config.utilities) {
        for (const utilityName in css.config.utilities) {
            const declarations = css.config.utilities[utilityName]
            const propsLength = Object.keys(declarations).length
            const propName = Object.keys(declarations)[0] as keyof typeof declarations
            const propValue = declarations[propName]
            let nativeCSSData: IPropertyData | IValueData | undefined
            let detail: string | undefined
            /**
             * Remaps to native CSS properties when only one property is declared
             * */
            if (propsLength === 1) {
                const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === propName)
                if (utilityName === propValue) {
                    nativeCSSData = nativeCSSPropertyData?.values?.find(({ name }) =>
                        name === propValue
                        // fix like inline-grid not found
                        || name.replace(/^-(ms|moz)-/, '') === propValue
                    )
                    detail = `${propName}: ${propValue}`
                } else {
                    nativeCSSData = nativeCSSPropertyData
                    detail = nativeCSSPropertyData?.syntax
                }
            }
            completionItems.push({
                label: utilityName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation(nativeCSSData, {
                    generatedCSS: generateCSS([utilityName], css)
                }),
                detail,
            })
        }
    }
    if (css.config.styles) {
        for (const styleName in css.config.styles) {
            const styleClasses = css.styles[styleName]
            completionItems.push({
                label: styleName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation({} as any, {
                    generatedCSS: generateCSS([styleName], css)
                }),
                detail: styleClasses.join(' ') + ' (style)',
            })
        }
    }
    process.env.VSCODE_IPC_HOOK && console.timeEnd('getMainCompletionItems')
    return completionItems
}