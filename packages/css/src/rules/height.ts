import { Rule } from '../'

export class Height extends Rule {
    static override id = 'Height' as const
    static override matches = '^h:.'

}