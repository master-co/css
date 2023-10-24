function defineVisitors({ settings }, visitNode) {
    const CallExpression = function (node) {
        const calleeStr = astUtil.calleeToString(node.callee)
        if (settings.functions.findIndex((name) => calleeStr === name) === -1) {
            return
        }
        node.arguments.forEach((arg) => {
            visitNode(node, arg)
        })
    }

    const scriptVisitor = {
        CallExpression,
        JSXAttribute: function (node) {
            if (!node.name || !new RegExp(settings.classMatching).test(node.name.name)) return
            if (node.value && node.value.type === 'Literal') {
                visitNode(node)
            } else if (node.value && node.value.type === 'JSXExpressionContainer') {
                visitNode(node, node.value.expression)
            }
        },
        SvelteAttribute: function (node) {
            if (!node.key?.name || !new RegExp(settings.classMatching).test(node.key.name)) return
            for (const eachValue of node.value) {
                visitNode(node, eachValue)
            }
        },
        TextAttribute: function (node) {
            if (!node.name || !new RegExp(settings.classMatching).test(node.name)) return
            visitNode(node)
        },
        TaggedTemplateExpression: function (node) {
            if (
                settings.functions.includes(node.tag.name) ||
                settings.functions.includes(node.tag?.object?.name) && node.tag?.type === 'MemberExpression'
            ) {
                visitNode(node, node.quasi)
                return
            }
        },
    }

    const templateBodyVisitor = {
        CallExpression,
        VAttribute: function (node) {
            if (node.value && node.value.type === 'VLiteral') {
                visitNode(node)
            } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ArrayExpression') {
                node.value.expression.elements.forEach((arg) => {
                    visitNode(node, arg)
                })
            } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ObjectExpression') {
                visitNode(node, prop)
            }
        },
    }

    if (context.parserServices == null || context.parserServices.defineTemplateBodyVisitor == null) {
        return scriptVisitor
    } else {
        return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
    }
}

module.exports = defineVisitors