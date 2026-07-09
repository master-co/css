import { AT_SIGN, MasterCSS, createDefaultCSS, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, type Condition, generateCondition, generateCSS, getSingleConditionNumberNode, parseCondition } from '@master/css-language'
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

export default function getQueryCompletionItems(css: MasterCSS = createDefaultCSS(), triggerCharacter = AT_SIGN, syntax: string, completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
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
            documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name + '()'], css, completionIndex.runtime)),
          }
        )
      })
  }

  const handleNumberNodes = (condition: Condition, token: string) => {
    const numberNode = getSingleConditionNumberNode(condition.nodes)
    if (numberNode) {
      const prevComparisonCharacter = syntax.charAt(syntax.length - 2)
      const comparisonCharacter = prevComparisonCharacter === '>' || prevComparisonCharacter === '<'
        ? prevComparisonCharacter + triggerCharacter
        : triggerCharacter
      const text = generateCondition(parseCondition(comparisonCharacter + token, css))
      completionItems.push({
        label: comparisonCharacter + token,
        sortText: CompletionItemKind.Keyword + comparisonCharacter + String(Math.round(numberNode.value)).padStart(12, '0'),
        filterText: token,
        insertText: token,
        detail: text,
        kind: CompletionItemKind.Keyword,
        documentation: createCSSMarkdownDocumentation(generateCSS([syntax + token], css, completionIndex.runtime)),
      })
      return true
    }
  }

  for (const [token, condition] of completionIndex.conditions) {
    const completionItem: Omit<CompletionItem, 'label'> = {
      filterText: token,
      insertText: token,
      documentation: createCSSMarkdownDocumentation(generateCSS([syntax + token], css, completionIndex.runtime))
    }
    if ([AT_SIGN, ...QUERY_LOGICAL_OPERATORS].includes(triggerCharacter)) {
      if (handleNumberNodes(condition, token)) continue
      const text = generateCondition(parseCondition(triggerCharacter + token, css))
      completionItems.push(
        {
          ...completionItem,
          label: triggerCharacter + token,
          detail: text,
          sortText: CompletionItemKind.Keyword + token,
          kind: CompletionItemKind.Keyword,
          documentation: createCSSMarkdownDocumentation(generateCSS([syntax + token], css, completionIndex.runtime)),
        }
      )
    } else if (QUERY_COMPARISON_OPERATORS.includes(triggerCharacter)) {
      handleNumberNodes(condition, token)
    }
  }
  return sortCompletionItems(completionItems)
}
