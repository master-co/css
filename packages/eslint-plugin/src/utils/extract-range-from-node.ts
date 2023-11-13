export default function extractRangeFromNode(node) {
    if (node.type === 'TextAttribute' && node.name === 'class') {
        return [node.valueSpan.fullStart.offset, node.valueSpan.end.offset]
    }
    switch (node.value.type) {
        case 'JSXExpressionContainer':
            return node.value.expression.range
        default:
            return node.value.range
    }
}