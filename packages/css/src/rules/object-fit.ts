import { Rule } from '../'

export class ObjectFit extends Rule {
    static override id = 'ObjectFit' as const
    static override matches = '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)'
}