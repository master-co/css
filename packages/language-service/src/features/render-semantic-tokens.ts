import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../common'
import { UtilityType, type ValueComponent } from '@master/css'

type SemanticTokenType = typeof SEMANTIC_TOKEN_TYPES[number]
type SemanticTokenModifier = typeof SEMANTIC_TOKEN_MODIFIERS[number]

interface SemanticTokenItem {
    start: number
    end: number
    type: SemanticTokenType
    modifiers?: SemanticTokenModifier[]
}

const tokenTypeIndex = new Map(SEMANTIC_TOKEN_TYPES.map((type, index) => [type, index]))
const tokenModifierIndex = new Map(SEMANTIC_TOKEN_MODIFIERS.map((modifier, index) => [modifier, index]))

function modifierBits(modifiers: SemanticTokenModifier[] = []) {
    let bits = 0
    for (const modifier of modifiers) {
        const index = tokenModifierIndex.get(modifier)
        if (index !== undefined) bits |= 1 << index
    }
    return bits
}

function encodeSemanticTokens(document: TextDocument, tokens: SemanticTokenItem[]): SemanticTokens {
    const data: number[] = []
    let previousLine = 0
    let previousCharacter = 0
    let previousEnd = -1
    for (const token of tokens
        .filter((token) => token.end > token.start)
        .sort((a, b) => a.start - b.start || a.end - b.end)) {
        if (token.start < previousEnd) continue
        const typeIndex = tokenTypeIndex.get(token.type)
        if (typeIndex === undefined) continue
        const startPosition = document.positionAt(token.start)
        const endPosition = document.positionAt(token.end)
        if (startPosition.line !== endPosition.line) continue
        data.push(
            startPosition.line - previousLine,
            startPosition.line === previousLine ? startPosition.character - previousCharacter : startPosition.character,
            endPosition.character - startPosition.character,
            typeIndex,
            modifierBits(token.modifiers)
        )
        previousLine = startPosition.line
        previousCharacter = startPosition.character
        previousEnd = token.end
    }
    return { data }
}

function pushToken(tokens: SemanticTokenItem[], start: number, length: number, type: SemanticTokenType, modifiers?: SemanticTokenModifier[]) {
    if (length <= 0) return
    tokens.push({ start, end: start + length, type, modifiers })
}

function pushKey(tokens: SemanticTokenItem[], start: number, keyToken?: string) {
    if (!keyToken) return
    const keyNameLength = keyToken.endsWith(':') ? keyToken.length - 1 : keyToken.length
    pushToken(tokens, start, keyNameLength, 'property')
    if (keyToken.endsWith(':')) {
        pushToken(tokens, start + keyNameLength, 1, 'operator')
    }
}

function pushValueComponent(tokens: SemanticTokenItem[], classStart: number, valueStart: number, valueText: string, component: ValueComponent) {
    switch (component.type) {
        case 'variable': {
            const alphaStart = valueText.lastIndexOf('/')
            if (component.alpha !== undefined && alphaStart > 0) {
                pushToken(tokens, valueStart, alphaStart, 'variable')
                pushToken(tokens, valueStart + alphaStart, 1, 'operator')
                pushToken(tokens, valueStart + alphaStart + 1, valueText.length - alphaStart - 1, 'number')
            } else {
                pushToken(tokens, valueStart, valueText.length, 'variable')
            }
            break
        }
        case 'number':
            pushToken(tokens, valueStart, valueText.length, 'number')
            break
        case 'function': {
            const functionStart = valueText.indexOf(component.name)
            if (component.name && functionStart >= 0) {
                pushToken(tokens, valueStart + functionStart, component.name.length, 'function')
            }
            const openParen = valueText.indexOf('(', functionStart + component.name.length)
            if (openParen >= 0) {
                pushToken(tokens, valueStart + openParen, 1, 'operator')
                const closeParen = valueText.lastIndexOf(')')
                if (closeParen > openParen) {
                    pushToken(tokens, valueStart + closeParen, 1, 'operator')
                }
                const innerStart = openParen + 1
                let childSearchStart = innerStart
                for (const child of component.children) {
                    const childToken = child.token
                    if (!childToken) continue
                    const childIndex = valueText.indexOf(childToken, childSearchStart)
                    if (childIndex < 0) continue
                    pushValueComponent(tokens, classStart, valueStart + childIndex, childToken, child)
                    childSearchStart = childIndex + childToken.length
                }
            }
            break
        }
        case 'separator':
            pushToken(tokens, valueStart, valueText.length, 'operator')
            break
        default:
            pushToken(tokens, valueStart, valueText.length, 'string')
    }
}

function pushValue(tokens: SemanticTokenItem[], classStart: number, token: string, valueStart: number, valueToken?: string, valueComponents?: ValueComponent[]) {
    if (!valueToken) return
    const valueText = token.slice(valueStart, valueStart + valueToken.length)
    if (!valueText) return
    if (valueComponents?.length === 1) {
        pushValueComponent(tokens, classStart, classStart + valueStart, valueText, valueComponents[0])
        return
    }
    let searchStart = 0
    for (const component of valueComponents ?? []) {
        const componentToken = component.token
        if (!componentToken) continue
        const index = valueText.indexOf(componentToken, searchStart)
        if (index < 0) continue
        pushValueComponent(tokens, classStart, classStart + valueStart + index, componentToken, component)
        searchStart = index + componentToken.length
    }
    if (!valueComponents?.length) {
        pushToken(tokens, classStart + valueStart, valueText.length, 'string')
    }
}

function pushState(tokens: SemanticTokenItem[], classStart: number, token: string, stateStart: number) {
    for (let i = stateStart; i < token.length;) {
        const char = token[i]
        if (char === '!') {
            pushToken(tokens, classStart + i, 1, 'operator')
            i++
        } else if (char === '_' || char === '(' || char === ')' || char === '[' || char === ']' || char === ',') {
            pushToken(tokens, classStart + i, 1, 'operator')
            i++
        } else if (char === '@') {
            const nextAt = token.indexOf('@', i + 1)
            const end = nextAt >= 0 ? nextAt : token.length
            pushToken(tokens, classStart + i, end - i, 'keyword')
            i = end
        } else if (char === ':') {
            const colonLength = token[i + 1] === ':' ? 2 : 1
            pushToken(tokens, classStart + i, colonLength, 'operator')
            const nameStart = i + colonLength
            const match = token.slice(nameStart).match(/^[\w-]+/)
            if (match) {
                pushToken(tokens, classStart + nameStart, match[0].length, 'modifier')
                i = nameStart + match[0].length
            } else {
                i = nameStart
            }
        } else {
            i++
        }
    }
}

export default function renderSemanticTokens(this: CSSLanguageService, document: TextDocument): SemanticTokens {
    const semanticTokens: SemanticTokenItem[] = []
    for (const classPosition of this.getClassPositions(document)) {
        const { raw, token } = classPosition
        if (!raw) continue
        const classStart = classPosition.range.start
        const rules = this.css.generate(token)
        const mainStyle = rules.find((rule) => rule.type === UtilityType.Static && rule.layerName === 'main')
        if (mainStyle) {
            pushToken(semanticTokens, classStart, raw.length, 'class', ['declaration'])
            continue
        }
        const rule = rules[0]
        if (!rule) continue
        if (rule.type === UtilityType.Static) {
            pushToken(semanticTokens, classStart, raw.length, 'class')
            continue
        }
        pushKey(semanticTokens, classStart, rule.keyToken)
        const valueStart = rule.keyToken?.length ?? Math.max(0, token.indexOf(rule.valueToken ?? ''))
        pushValue(semanticTokens, classStart, token, valueStart, rule.valueToken, rule.valueComponents)
        pushState(semanticTokens, classStart, token, valueStart + (rule.valueToken?.length ?? 0))
    }
    return encodeSemanticTokens(document, semanticTokens)
}
