import { Rule } from '../rule'

export class ObjectPosition extends Rule {
    static id = 'ObjectPosition' as const
    static matches = '^(?:object|obj):(?:top|bottom|right|left|center|$values)'
}