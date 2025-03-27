import { AT_SIGN, AtDescriptorComponent, MasterCSS, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, generateCSS, parseAt } from '@master/css'
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import cssDataProvider from './css-data-provider'

export default function getQueryCompletionItems(css: MasterCSS = new MasterCSS(), triggerCharacter = AT_SIGN, syntax: string): CompletionItem[] {
    const atDataList = cssDataProvider.provideAtDirectives()
    const completionItems: CompletionItem[] = []
    if (!QUERY_COMPARISON_OPERATORS.includes(triggerCharacter)) {
        completionItems.push(
            {
                label: triggerCharacter + 'media()',
                filterText: 'media()',
                insertText: 'media()',
                sortText: 'media()',
                documentation: getCSSDataDocumentation(atDataList.find(({ name }) => name === '@media'), {
                    generatedCSS: generateCSS([syntax + 'media()'], css),
                    docs: '/guide/syntax#at-rules'
                }),
            },
            {
                label: triggerCharacter + 'supports()',
                filterText: 'supports()',
                insertText: 'supports()',
                sortText: 'supports()',
                documentation: getCSSDataDocumentation(atDataList.find(({ name }) => name === '@supports'), {
                    generatedCSS: generateCSS([syntax + 'supports()'], css),
                    docs: '/guide/syntax#at-rules'
                }),
            }
        )
    }
    css.at.forEach((atDefinition, token) => {
        const completionItem: Omit<CompletionItem, 'label'> = {
            filterText: token,
            insertText: token,
            documentation: getCSSDataDocumentation(undefined, {
                generatedCSS: generateCSS([syntax + token], css),
                docs: '/guide/syntax#at-rules'
            })
        }
        if ([AT_SIGN, ...QUERY_LOGICAL_OPERATORS].includes(triggerCharacter)) {
            const atComponent = parseAt(token, css).atComponents[0] as AtDescriptorComponent
            if (typeof atDefinition.value === 'number') {
                completionItems.push({
                    ...completionItem,
                    label: triggerCharacter + token,
                    sortText: String(atDefinition.value).padStart(8, '0'),
                    filterText: token,
                    insertText: token,
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([syntax + token], css),
                        docs: '/guide/syntax#at-rules'
                    }),
                    detail: `${atComponent.operator} ${atComponent.value}${atComponent.unit}`,
                    kind: CompletionItemKind.Keyword
                })
            } else {
                completionItems.push(
                    {
                        ...completionItem,
                        label: triggerCharacter + token,
                        detail: (atDefinition.name ? atDefinition.name + ':' : atDefinition.name) + atDefinition.value,
                        sortText: token,
                        kind: CompletionItemKind.Keyword,
                    }
                )
            }
        } else if (QUERY_COMPARISON_OPERATORS.includes(triggerCharacter)) {
            const atComponent = parseAt(token, css).atComponents[0] as AtDescriptorComponent
            if (typeof atDefinition.value === 'number') {
                const prevComparisonCharacter = syntax.charAt(syntax.length - 2)
                const comparisonCharacter = prevComparisonCharacter === '>' || prevComparisonCharacter === '<'
                    ? prevComparisonCharacter + triggerCharacter
                    : triggerCharacter
                completionItems.push({
                    ...completionItem,
                    label: comparisonCharacter + token,
                    sortText: comparisonCharacter + String(atDefinition.value).padStart(8, '0'),
                    filterText: token,
                    insertText: token,
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([syntax + token], css),
                        docs: '/guide/syntax#at-rules'
                    }),
                    detail: `${atComponent.operator} ${atComponent.value}${atComponent.unit}`,
                    kind: CompletionItemKind.Keyword
                })
            }
        }
    })
    return sortCompletionItems(completionItems)
}