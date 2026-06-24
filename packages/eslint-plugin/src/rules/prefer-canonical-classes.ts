import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
    defaultCanonicalClassNameOptions,
    suggestCanonicalClassGroups,
    suggestCanonicalClassName,
    type CanonicalClassNameOptions
} from '@master/css-lint'

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

        return defineVisitors({ context, settings }, (node, { nodes, classNodes, classValues }) => {
            const groupSuggestions = suggestCanonicalClassGroups(classValues, css, options)
            const coveredClassNames = new Set(groupSuggestions.flatMap((suggestion) => suggestion.classNames))
            const getGroupFixes = (suggestion: typeof groupSuggestions[number], fixer) => {
                const [firstClassName, ...classNamesToRemove] = suggestion.classNames
                const firstClassNode = classNodes.find((node) => node.value === firstClassName)
                if (!firstClassNode) return []
                const fixes = [
                    fixer.replaceTextRange(firstClassNode.range as [number, number], suggestion.recommended)
                ]
                const getRemovalRange = (className: string) => {
                    for (let i = 0; i < nodes.length; i++) {
                        const targetNode = nodes[i]
                        const target = targetNode.type === 'class' && targetNode.value === className
                        if (!target) continue
                        const prev = nodes[i - 1]
                        const next = nodes[i + 1]
                        const isSpaceBefore = prev && prev.type === 'space'
                        if (isSpaceBefore) {
                            return [prev.range[0], targetNode.range[1]] as [number, number]
                        }
                        if (next && next.type === 'space') {
                            return [targetNode.range[0], next.range[1]] as [number, number]
                        }
                        return targetNode.range as [number, number]
                    }
                }
                for (const className of classNamesToRemove) {
                    const removalRange = getRemovalRange(className)
                    if (!removalRange) continue
                    fixes.push(fixer.removeRange(removalRange))
                }
                return fixes
            }

            for (const suggestion of groupSuggestions) {
                const firstClassNode = classNodes.find((node) => node.value === suggestion.classNames[0])
                if (!firstClassNode) continue
                context.report({
                    node,
                    loc: firstClassNode.loc,
                    messageId: 'preferClass',
                    data: {
                        actual: suggestion.classNames.join(' '),
                        recommended: suggestion.recommended
                    },
                    fix(fixer) {
                        return getGroupFixes(suggestion, fixer)
                    }
                })
            }

            for (const classNode of classNodes) {
                if (coveredClassNames.has(classNode.value)) continue
                const recommended = suggestCanonicalClassName(classNode.value, css, options)
                if (!recommended) continue
                context.report({
                    node,
                    loc: classNode.loc,
                    messageId: 'preferClass',
                    data: {
                        actual: classNode.value,
                        recommended
                    },
                    fix(fixer) {
                        return fixer.replaceTextRange(classNode.range as [number, number], recommended)
                    }
                })
            }
        })
    }
})
