import { Rule } from '../rule'

export class JustifySelf extends Rule {
    static id = 'JustifySelf' as const
    static matches =  '^js:.'
}