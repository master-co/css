import { Rule } from '../rule'

export class Flex extends Rule {
    static override id = 'Flex' as const
    static override unit = ''
    override order = -1
}