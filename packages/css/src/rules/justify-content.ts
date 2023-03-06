import { Rule } from '../rule'

export class JustifyContent extends Rule {
    static id = 'JustifyContent' as const
    static matches =  '^jc:.'

}