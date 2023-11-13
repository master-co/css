import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import { Rule } from 'eslint'
import findLoc from '../utils/find-loc'
import { parseNodeRecursive } from '../utils/parse-node-recursive'
import validateAction from '../utils/validate-action'

export default {
    meta: {
        docs: {
            description: 'Detect syntax errors early when writing classes',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#syntax-error-checks',
        },
        messages: {
            invalidClass: '{{message}}',
            disallowUnknownClass: '{{message}}',
        },
        fixable: null,
        schema: [
            {
                type: 'object',
                properties: {
                    calleeMatching: {
                        type: 'string'
                    },
                    classMatching: {
                        type: 'string'
                    },
                    ignoredKeys: {
                        type: 'array',
                        items: { type: 'string', minLength: 0 },
                        uniqueItems: true,
                    },
                    config: {
                        type: ['string', 'object'],
                    }
                },
            },
        ],
    },
    create: function (context) {
        const { options, settings } = resolveContext(context)
        const visitNode = (node, arg = null) => {
            parseNodeRecursive(
                node,
                arg,
                (classNames, node) => {
                    const sourceCode = context.sourceCode
                    const sourceCodeLines = sourceCode.lines
                    const nodeStartLine = node.loc.start.line
                    const nodeEndLine = node.loc.end.line
                    for (const className of classNames) {
                        const { isMasterCSS, errors } = validateAction(className, settings.config)
                        if (errors.length > 0) {
                            for (const error of errors) {
                                if (isMasterCSS) {
                                    context.report({
                                        loc: findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                        messageId: 'invalidClass',
                                        data: {
                                            message: error.message + '.',
                                        }
                                    })
                                } else if (options.disallowUnknownClass) {
                                    context.report({
                                        loc: findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                        messageId: 'disallowUnknownClass',
                                        data: {
                                            message: `"${className}" is not a valid or known class.`
                                        }
                                    })
                                }
                            }
                        }
                    }
                },
                false,
                false,
                settings.ignoredKeys,
                context
            )
        }
        return defineVisitors({ context, settings }, visitNode)
    },
} as Rule.RuleModule