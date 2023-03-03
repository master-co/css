import { Rule } from '../'

export default class extends Rule {
    static override id = 'Height' as const
    static override matches = '^h:.'

}