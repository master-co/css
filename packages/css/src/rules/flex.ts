import Rule from '../rule'

export default class extends Rule {
    static override id: 'Flex' = 'Flex' as const
    static override unit = ''
    override order = -1
}