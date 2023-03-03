import { Rule } from '../'

export class JustifyItems extends Rule {
    static override id = 'JustifyItems' as const
    static override matches =  '^ji:.'

}