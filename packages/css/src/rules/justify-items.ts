import { Rule } from '../rule'

export class JustifyItems extends Rule {
    static id = 'JustifyItems' as const
    static matches =  '^ji:.'

}