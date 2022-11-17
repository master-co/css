import Rule from '../rule'

export default class extends Rule {
    static override id = 'JustifyContent' as const
    static override matches =  '^jc:.'

}