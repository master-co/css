import { Rule } from '../'

export class JustifySelf extends Rule {
    static override id = 'JustifySelf' as const
    static override matches =  '^js:.'
}