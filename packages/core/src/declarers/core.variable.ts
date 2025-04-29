import { SyntaxRule } from '../syntax-rule'

export default function coreVariable(this: SyntaxRule, value: string) {
    return {
        ['--' + this.keyToken.slice(1, -1)]: value
    }
}