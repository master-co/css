import { TRIGGER_CHARACTERS } from '../common'

export default function analyzeSyntaxCompletionStates(syntax: string) {
    const keyCompleted = new RegExp(`[${TRIGGER_CHARACTERS.selector.join('') + TRIGGER_CHARACTERS.at.join('')}]`).test(syntax.slice(1))
    return {
        keyCompleted
    }
}