import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
    defaultCanonicalClassNameOptions,
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

        return defineVisitors({ context, settings }, (node, { classNodes }) => {
            for (const classNode of classNodes) {
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
