import { Rule } from '../rule'

export class GridTemplateColumns extends Rule {
    static id = 'GridTemplateColumns' as const
    static matches = '^grid-template-cols:.'
}