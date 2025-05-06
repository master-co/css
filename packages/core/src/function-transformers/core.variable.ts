import { SyntaxRule } from '../syntax-rule'

export default function coreVariable(this: SyntaxRule, value: string) {
    let name: string
    let fallback!: string
    const firstCommaIndex = value.indexOf(',')
    if (firstCommaIndex !== -1) {
        name = value.slice(0, firstCommaIndex)
        fallback = value.slice(firstCommaIndex + 1)
    } else {
        name = value
    }
    return [{ type: 'variable', name, fallback, token: value }]
}