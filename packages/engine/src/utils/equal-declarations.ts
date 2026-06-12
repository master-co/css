import { Utility } from '../utility'

export default function equalDeclarations(a: Utility['declarations'] = {}, b: Utility['declarations'] = {}): boolean {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false
    }
    return Object.keys(a).every(key => key in b)
}
