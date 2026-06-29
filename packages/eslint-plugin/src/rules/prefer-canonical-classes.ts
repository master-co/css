import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import resolveComposeDirectiveClassNodes from '../utils/resolve-compose-directive-class-nodes'
import createRule from '../create-rule'
import {
    defaultCanonicalClassNameOptions,
    replaceClassGroupInClassList,
    replaceClassNameInClassList,
    suggestCanonicalComposeDirective,
    suggestCanonicalClassGroups,
    suggestCanonicalClassName,
    type CanonicalClassNameOptions
} from '@master/css-lint'
import type { ResolvedClassNode } from '../utils/resolve-class-node'
import type { ResolvedComposeDirectiveClassNode } from '../utils/resolve-compose-directive-class-nodes'

export default createRule({
    name: 'prefer-canonical-classes',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer canonical Master CSS classes'
        },
        messages: {
            preferClass: 'Prefer "{{recommended}}" over "{{actual}}".',
        },
        fixable: 'code',
        schema: [{
            type: 'object',
            properties: {
                preferStaticUtilities: { type: 'boolean' },
                preferThemeTokens: { type: 'boolean' },
                preferPropertyAliases: { type: 'boolean' },
                preferVariableReferences: { type: 'boolean' },
                preferMultiValueTokens: { type: 'boolean' },
                preferCompositionUtilities: { type: 'boolean' },
                preferConditionOrder: { type: 'boolean' },
                preferNativeDeclarationsInCompose: { type: 'boolean' },
                preferVariantBlocksInCompose: { type: 'boolean' },
            },
            additionalProperties: false
        }]
    },
    defaultOptions: [defaultCanonicalClassNameOptions],
    create(context) {
        const { settings, css } = resolveContext(context)
        const options = {
            ...defaultCanonicalClassNameOptions,
            ...((context.options[0] || {}) as Partial<CanonicalClassNameOptions>)
        }

        const reportCanonicalClassList = (node, { raw, start, end, unescape, classNodes, classValues }: ResolvedClassNode) => {
            const groupSuggestions = suggestCanonicalClassGroups(classValues, css, options)
            const coveredClassNames = new Set(groupSuggestions.flatMap((suggestion) => suggestion.classNames))
            const reports: {
                loc: (typeof classNodes)[number]['loc']
                actual: string
                recommended: string
            }[] = []
            let fixedRaw = raw

            for (const suggestion of groupSuggestions) {
                const firstClassNode = classNodes.find((node) => node.value === suggestion.classNames[0])
                if (!firstClassNode) continue
                fixedRaw = replaceClassGroupInClassList(fixedRaw, suggestion.classNames, suggestion.recommended, { unescape })
                reports.push({
                    loc: firstClassNode.loc,
                    actual: suggestion.classNames.join(' '),
                    recommended: suggestion.recommended
                })
            }

            for (const classNode of classNodes) {
                if (coveredClassNames.has(classNode.value)) continue
                const recommended = suggestCanonicalClassName(classNode.value, css, options)
                if (!recommended) continue
                fixedRaw = replaceClassNameInClassList(fixedRaw, classNode.value, recommended, { unescape })
                reports.push({
                    loc: classNode.loc,
                    actual: classNode.value,
                    recommended
                })
            }

            for (const report of reports) {
                context.report({
                    node,
                    loc: report.loc,
                    messageId: 'preferClass',
                    data: {
                        actual: report.actual,
                        recommended: report.recommended
                    },
                    fix(fixer) {
                        return fixer.replaceTextRange([start, end], fixedRaw)
                    }
                })
            }
        }

        const reportCanonicalComposeDirective = (node, classNode: ResolvedComposeDirectiveClassNode) => {
            const result = suggestCanonicalComposeDirective(classNode.raw, css, options)
            if (!result) return
            if (!result.structuralChange) {
                reportCanonicalClassList(node, classNode)
                return
            }

            const replacement = result.replacement
                ? formatComposeDirectiveReplacement(
                    context.sourceCode.getText(),
                    classNode.directiveStart,
                    result.replacement
                )
                : undefined

            for (const suggestion of result.suggestions) {
                const firstClassNode = classNode.classNodes.find((node) => node.value === suggestion.classNames[0])
                    || classNode.classNodes[0]
                context.report({
                    node,
                    loc: firstClassNode?.loc,
                    messageId: 'preferClass',
                    data: {
                        actual: suggestion.actual,
                        recommended: suggestion.recommended
                    },
                    ...(replacement
                        ? {
                            fix(fixer) {
                                return fixer.replaceTextRange([classNode.directiveStart, classNode.directiveEnd], replacement)
                            }
                        }
                        : {})
                })
            }
        }

        const visitors = defineVisitors({ context, settings }, reportCanonicalClassList)
        const visitProgram = visitors.Program

        return {
            ...visitors,
            Program(node) {
                if (typeof visitProgram === 'function') {
                    visitProgram(node)
                }
                for (const classNode of resolveComposeDirectiveClassNodes(context)) {
                    reportCanonicalComposeDirective(node, classNode)
                }
            }
        }
    }
})

function getLinePrefix(source: string, index: number) {
    return source.slice(source.lastIndexOf('\n', index - 1) + 1, index)
}

function formatComposeDirectiveReplacement(source: string, index: number, replacement: string) {
    const linePrefix = getLinePrefix(source, index)
    if (/\S/.test(linePrefix)) return replacement.replace(/\n\s*/g, ' ')
    return replacement.replace(/\n/g, `\n${linePrefix}`)
}
