import Rule from '../rule'

export default class extends Rule {
    static override id: 'Transition' = 'Transition' as const
    static override symbol = '~' 
    override order = -1
}