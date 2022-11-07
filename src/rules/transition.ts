import Rule from '../rule'

export default class extends Rule {
    static override id = 'Transition'
    static override symbol = '~' 
    override order = -1
}