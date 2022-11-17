import Rule from '../rule'

export default class extends Rule {
    static override id = 'ObjectPosition' as const
    static override matches = '^(?:object|obj):(?:top|bottom|right|left|center|$values)'
}