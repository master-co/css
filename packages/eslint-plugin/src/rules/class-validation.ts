import * as astUtil from '../utils/ast'
import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import { validate } from '@master/css-validator'
import { Rule } from 'eslint'

export default {
    meta: {
        docs: {
            description: 'Check the validity of classes with your configuration',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#check-the-validity-of-classes-with-your-configuration',
        },
        messages: {
            invalidClass: '{{message}}',
            disallowUnknowClass: '{{message}}',
        },
        fixable: null
    },
    create: function (context) {
        const { options, settings, config } = resolveContext(context)
        const visitNode = (node, arg = null) => {
            astUtil.parseNodeRecursive(
                node,
                arg,
                (classNames, node) => {
                    const sourceCode = context.getSourceCode()
                    const sourceCodeLines = sourceCode.lines
                    const nodeStartLine = node.loc.start.line
                    const nodeEndLine = node.loc.end.line
                    for (const className of classNames) {
                        const { isMasterCSS, errors } = validate(className, { config })
                        if (errors.length > 0) {
                            for (const error of errors) {
                                if (isMasterCSS) {
                                    context.report({
                                        loc: astUtil.findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                        messageId: 'invalidClass',
                                        data: {
                                            message: error.message + '.',
                                        }
                                    })
                                } else if (options.disallowUnknowClass) {
                                    context.report({
                                        loc: astUtil.findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                        messageId: 'disallowUnknowClass',
                                        data: {
                                            message: `"${className}" is not a valid or known class.`,
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
        return defineVisitors({ context, options, settings, config }, visitNode)
    },
} as Rule.RuleModule