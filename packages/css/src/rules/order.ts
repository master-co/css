import { Rule } from '../rule'

export class Order extends Rule {
    static override id = 'Order' as const
    static override matches = '^o:.'
    static override unit = ''
}