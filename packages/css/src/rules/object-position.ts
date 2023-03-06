import { Rule } from '../rule'

export class ObjectPosition extends Rule {
    static override id = 'ObjectPosition' as const
    static override matches = '^(?:object|obj):(?:top|bottom|right|left|center|$values)'
}