'use strict'

const astUtil = require('../utils/ast')
const getOption = require('../utils/settings')
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
            invalidClass: 'Not a valid class.',
        },
        fixable: null,
        schema: [
            {
                type: 'object',
                properties: {
                    callees: {
                        type: 'array',
                        items: { type: 'string', minLength: 0 },
                        uniqueItems: true,
                    },
                    ignoredKeys: {
                        type: 'array',
                        items: { type: 'string', minLength: 0 },
                        uniqueItems: true,
                    },
                    config: {
                        // returned from `loadConfig()` utility
                        type: ['string', 'object'],
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string', minLength: 0 },
                        uniqueItems: true,
                    },
                },
            },
        ],
    },

    create: function (context) {
        const callees = getOption(context, 'callees')
        const tags = getOption(context, 'tags')
        const masterCssConfig = getOption(context, 'config')
        const classRegex = getOption(context, 'classRegex')
        const ignoredKeys = getOption(context, 'ignoredKeys')
        const checkNodeArgumentValue = (node, arg = null) => {
            astUtil.parseNodeRecursive(
                node,
                arg,
                (classNames, node) => {
                    for (const className of classNames) {
                        const { errors } = validate(className, { config: masterCssConfig })
                        if (errors.length > 0) {
                            for (const error of errors) {
                                context.report({
                                    node,
                                    messageId: 'invalidClass',
                                    data: {
                                        message: error.message,
                                    }
                                })
                            }
                        }

                    }
                },
                false,
                false,
                ignoredKeys
            )
        }

        const callExpressionVisitor = function (node) {
            const calleeStr = astUtil.calleeToString(node.callee)
            if (callees.findIndex((name) => calleeStr === name) === -1) {
                return
            }

            node.arguments.forEach((arg) => {
                checkNodeArgumentValue(node, arg)
            })
        }

        const scriptVisitor = {
            CallExpression: callExpressionVisitor,
            JSXAttribute: function (node) {
                if (!node.name || !new RegExp(classRegex).test(node.name.name)) return
                if (node.value && node.value.type === 'Literal') {
                    checkNodeArgumentValue(node)
                } else if (node.value && node.value.type === 'JSXExpressionContainer') {
                    checkNodeArgumentValue(node, node.value.expression)
                }
            },
            SvelteAttribute: function (node) {
                if (!node.key?.name || !new RegExp(classRegex).test(node.key.name)) return
                for (const eachValue of node.value) {
                    checkNodeArgumentValue(node, eachValue)
                }
            },
            TextAttribute: function (node) {
                if (!node.name || !new RegExp(classRegex).test(node.name)) return
                checkNodeArgumentValue(node)
            },
            TaggedTemplateExpression: function (node) {
                if (!tags.includes(node.tag.name)) {
                    return
                }
                checkNodeArgumentValue(node, node.quasi)
            },
        }

        const templateBodyVisitor = {
            CallExpression: callExpressionVisitor,
            VAttribute: function (node) {
                if (node.value && node.value.type === 'VLiteral') {
                    checkNodeArgumentValue(node)
                } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ArrayExpression') {
                    node.value.expression.elements.forEach((arg) => {
                        checkNodeArgumentValue(node, arg)
                    })
                } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ObjectExpression') {
                    checkNodeArgumentValue(node, prop)
                }
            },
        }

        if (context.parserServices == null || context.parserServices.defineTemplateBodyVisitor == null) {
            return scriptVisitor
        } else {
            return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
        }
    },
}
