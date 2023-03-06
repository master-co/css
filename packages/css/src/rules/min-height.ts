import { Rule } from '../rule'

export class MinHeight extends Rule {
    static id = 'MinHeight' as const
    static matches = '^min-h:.'
}