import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import recommendClass from '../functions/recommend-class'

interface Options {
    preferStaticUtilities?: boolean
    preferVariables?: boolean
    preferKeyAliases?: boolean
}

const defaultOptions: Required<Options> = {
    preferStaticUtilities: true,
    preferVariables: true,
    preferKeyAliases: true
}

export default createRule({
    name: 'class-recommendation',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer recommended Master CSS classes'
        },
        messages: {
            preferClass: 'Prefer "{{recommended}}" over "{{actual}}".',
        },
        fixable: 'code',
        schema: [{
            type: 'object',
            properties: {
                preferStaticUtilities: { type: 'boolean' },
                preferVariables: { type: 'boolean' },
                preferKeyAliases: { type: 'boolean' },
            },
            additionalProperties: false
        }]
    },
    defaultOptions: [defaultOptions],
    create(context) {
        const { settings, css } = resolveContext(context)
        const options = {
            ...defaultOptions,
            ...((context.options[0] || {}) as Options)
        }

        return defineVisitors({ context, settings }, (node, { classNodes }) => {
            for (const classNode of classNodes) {
                const recommended = recommendClass(classNode.value, css, options)
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
