import { AT_SIGN, AtRule, MasterCSS, createCSS, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, generateAt, generateCSS, getSingleAtNumberRuleNode, parseAt } from '@master/css'
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import cssDataProvider from './css-data-provider'

export default function getQueryCompletionItems(css: MasterCSS = createCSS(), triggerCharacter = AT_SIGN, syntax: string): CompletionItem[] {
    const atDataList = cssDataProvider.provideAtDirectives()
    const completionItems: CompletionItem[] = []
    if (!QUERY_COMPARISON_OPERATORS.includes(triggerCharacter)) {
        ['media', 'container', 'supports']
            .forEach((name) => {
                completionItems.push(
                    {
                        label: triggerCharacter + name + '()',
                        filterText: name + '()',
                        insertText: name + '()',
                        sortText: name + '()',
                        documentation: getCSSDataDocumentation(atDataList.find(({ name }) => name === '@' + name), {
                            generatedCSS: generateCSS([syntax + name + '()'], css),
                            docs: '/guide/at'
                        }),
                    }
                )
            })
    }

    const handleNumberNodes = (atRule: AtRule, token: string) => {
        const numberNode = getSingleAtNumberRuleNode(atRule.nodes)
        if (numberNode) {
            const prevComparisonCharacter = syntax.charAt(syntax.length - 2)
            const comparisonCharacter = prevComparisonCharacter === '>' || prevComparisonCharacter === '<'
                ? prevComparisonCharacter + triggerCharacter
                : triggerCharacter
            const text = generateAt(parseAt(comparisonCharacter + token, css))
            completionItems.push({
                label: comparisonCharacter + token,
                sortText: CompletionItemKind.Keyword + comparisonCharacter + String(Math.round(numberNode.value)).padStart(12, '0'),
                filterText: token,
                insertText: token,
                detail: text,
                kind: CompletionItemKind.Keyword,
                documentation: getCSSDataDocumentation(undefined, {
                    generatedCSS: generateCSS([syntax + token], css),
                    docs: '/guide/at'
                }),
            })
            return true
        }
    }

    css.atRules.forEach((atRule, token) => {
        const completionItem: Omit<CompletionItem, 'label'> = {
            filterText: token,
            insertText: token,
            documentation: getCSSDataDocumentation(undefined, {
                generatedCSS: generateCSS([syntax + token], css),
                docs: '/guide/at'
            })
        }
        if ([AT_SIGN, ...QUERY_LOGICAL_OPERATORS].includes(triggerCharacter)) {
            if (handleNumberNodes(atRule, token)) return
            const text = generateAt(parseAt(triggerCharacter + token, css))
            completionItems.push(
                {
                    ...completionItem,
                    label: triggerCharacter + token,
                    detail: text,
                    sortText: CompletionItemKind.Keyword + token,
                    kind: CompletionItemKind.Keyword,
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([syntax + token], css),
                        docs: '/guide/at'
                    }),
                }
            )
        } else if (QUERY_COMPARISON_OPERATORS.includes(triggerCharacter)) {
            handleNumberNodes(atRule, token)
        }
    })
    return sortCompletionItems(completionItems)
}