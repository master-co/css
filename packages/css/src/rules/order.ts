import { Rule } from '../'

export class Order extends Rule {
    static override id = 'Order' as const
    static override matches = '^o:.'
    static override unit = ''
}