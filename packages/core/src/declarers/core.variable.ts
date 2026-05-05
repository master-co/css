import { Utility } from '../utility'

export default function coreVariable(this: Utility, value: string) {
    return {
        ['--' + this.keyToken.slice(1, -1)]: value
    }
}