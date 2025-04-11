import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import { HALF_WIDTH_WHITESPACE_GLOBAL_REGEX, HALF_WIDTH_WHITESPACE_REGEX } from '../common'

export default function resolveClassNode(node: any, context: RuleContext<any, any[]>) {
    const { sourceCode } = context
    let value: string = null
    let raw: string = null
    let start: number = null
    let end: number = null
    switch (node.type) {
        case 'Literal':
            value = node.value
            raw = node.raw
            start = node.range[0]
            end = node.range[1]
            break
        case 'VLiteral':
            value = node.value
            raw = sourceCode.getText(node)
            start = node.range[0]
            end = node.range[1]
            break
        case 'TextAttribute':
            value = node.value
            start = node.valueSpan.fullStart.offset
            end = node.valueSpan.end.offset
            raw = sourceCode.getText({
                ...node,
                range: [start, end],
            })
            break
        case 'SvelteLiteral':
            value = node.value
            raw = sourceCode.getText(node)
            start = node.range[0]
            end = node.range[1]
            break
        case 'TemplateElement':
            if (node.parent.expressions.length) {
                return
            }
            value = node.value.cooked
            raw = node.value.raw
            start = node.range[0] + 1
            end = node.range[1] - 1
            break
        default:
            return
    }

    if (/^(['"`])(.*)\1$/.test(raw)) {
        raw = raw.slice(1, -1)
        start = start + 1
        end = end - 1
    }

    const nodes = []
    const classValues = value.split(HALF_WIDTH_WHITESPACE_REGEX)
    const classRaws = raw.split(HALF_WIDTH_WHITESPACE_REGEX)
    const classValueRawMap = new Map()
    const classRawValueMap = new Map()
    for (let i = 0; i < classRaws.length; i++) {
        classValueRawMap.set(classValues[i], classRaws[i])
        classRawValueMap.set(classRaws[i], classValues[i])
    }

    let lastIndex = 0
    let match

    while ((match = HALF_WIDTH_WHITESPACE_GLOBAL_REGEX.exec(raw)) !== null) {
        const spaceRaw = match[0]
        const spaceStart = match.index
        const spaceEnd = spaceStart + spaceRaw.length

        if (spaceStart > lastIndex) {
            const classRaw = raw.slice(lastIndex, spaceStart)
            const classValue = classRawValueMap.get(classRaw)
            if (!classValue) return
            const startOffset = start + lastIndex
            const endOffset = start + spaceStart

            nodes.push({
                type: 'class',
                value: classValue,
                raw: classRaw,
                range: [startOffset, endOffset],
                loc: {
                    start: sourceCode.getLocFromIndex(startOffset),
                    end: sourceCode.getLocFromIndex(endOffset),
                },
            })
        }

        const spaceStartOffset = start + spaceStart
        const spaceEndOffset = start + spaceEnd

        nodes.push({
            type: 'space',
            raw: spaceRaw,
            range: [spaceStartOffset, spaceEndOffset],
            loc: {
                start: sourceCode.getLocFromIndex(spaceStartOffset),
                end: sourceCode.getLocFromIndex(spaceEndOffset),
            },
        })

        lastIndex = spaceEnd
    }

    if (lastIndex < raw.length) {
        const classRaw = raw.slice(lastIndex)
        const classValue = classRawValueMap.get(classRaw)
        if (!classValue) return
        const startOffset = start + lastIndex
        const endOffset = start + raw.length

        nodes.push({
            type: 'class',
            value: classValue,
            raw: classRaw,
            range: [start, endOffset],
            loc: {
                start: sourceCode.getLocFromIndex(startOffset),
                end: sourceCode.getLocFromIndex(endOffset),
            },
        })
    }

    const classNodes = nodes.filter((node) => node.type === 'class')

    return {
        nodes,
        start,
        end,
        raw,
        value,
        classRawValueMap,
        classValueRawMap,
        classNodes,
        classValues: classNodes.map((node) => node.value),
    }
}