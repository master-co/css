import { Utility } from '../utility'

export default function coreVariable(this: Utility, value: string) {
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