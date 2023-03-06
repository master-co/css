import { Rule } from '../rule'

export class VerticalAlign extends Rule {
    static id = 'VerticalAlign' as const
    static matches = '^(?:v|vertical):.'
}