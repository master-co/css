import { Rule } from '../'

export default class extends Rule {
    static override id = 'MinHeight' as const
    static override matches = '^min-h:.'
}