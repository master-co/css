import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
    defaultCanonicalClassNameOptions,
    replaceClassGroupInClassList,
    replaceClassNameInClassList,
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
                preferConditionOrder: { type: 'boolean' },
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

        return defineVisitors({ context, settings }, (node, { raw, start, end, unescape, classNodes, classValues }) => {
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
        })
    }
})
