import { Rule } from '../rule'

export class Height extends Rule {
    static id = 'Height' as const
    static matches = '^h:.'

}