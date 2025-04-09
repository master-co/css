import { SyntaxRule } from '../syntax-rule'

export default function equalDeclarations(a: SyntaxRule['declarations'] = {}, b: SyntaxRule['declarations'] = {}): boolean {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false
    }
    return Object.keys(a).every(key => key in b)
}
