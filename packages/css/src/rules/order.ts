import { Rule } from '../rule'

export class Order extends Rule {
    static id = 'Order' as const
    static matches = '^o:.'
    static unit = ''
}