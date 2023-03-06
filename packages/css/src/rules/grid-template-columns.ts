import { Rule } from '../rule'

export class GridTemplateColumns extends Rule {
    static override id = 'GridTemplateColumns' as const
    static override matches = '^grid-template-cols:.'
}