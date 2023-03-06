import { Rule } from '../rule'

export class Flex extends Rule {
    static id = 'Flex' as const
    static unit = ''
    override order = -1
}