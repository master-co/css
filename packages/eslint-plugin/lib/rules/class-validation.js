
const astUtil = require('../utils/ast')
const defineVisitors = require('../utils/define-visitors')
const resolveContext = require('../utils/resolve-context')
const { validate } = require('@master/css-validator')

module.exports = {
    meta: {
        docs: {
            description: 'Check the validity of classes with your configuration',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://beta.css.master.co/docs/code-linting#check-the-validity-of-classes-with-your-configuration',
        },
        messages: {
            invalidClass: '{{message}}',
            disallowTraditionalClass: '{{message}}',
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
                                } else if (!isMasterCSS && options.disallowTraditionalClass) {
                                    context.report({
                                        loc: astUtil.findLoc(className, sourceCodeLines, nodeStartLine, nodeEndLine),
                                        messageId: 'disallowTraditionalClass',
                                        data: {
                                            message: `Disallow a traditional class \`${className}\`.`,
                                        },
                                        fix: function (fixer) {
                                            return fixer.replaceTextRange([start, end], '')
                                        }
                                    })
                                }
                            }
                        }
                    }
                },
                false,
                false,
                settings.ignoredKeys
            )
        }
        return defineVisitors({ context, options, settings, config }, visitNode)
    },
}
