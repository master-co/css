import { Rule } from '../'

export class JustifyContent extends Rule {
    static override id = 'JustifyContent' as const
    static override matches =  '^jc:.'

}