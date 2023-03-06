import { Rule } from '../rule'

export class ObjectFit extends Rule {
    static id = 'ObjectFit' as const
    static matches = '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)'
}