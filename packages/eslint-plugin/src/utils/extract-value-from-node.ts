
export default function extractValueFromNode(node) {
    if (node.type === 'TextAttribute' && node.name === 'class') {
        return node.value
    }
    switch (node.value.type) {
        case 'JSXExpressionContainer':
            return node.value.expression.value
        case 'VExpressionContainer':
            switch (node.value.expression.type) {
                case 'ArrayExpression':
                    return node.value.expression.elements
                case 'ObjectExpression':
                    return node.value.expression.properties
            }
            return node.value.expression.value
        default:
            return node.value.value
    }
}