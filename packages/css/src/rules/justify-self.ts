import Rule from '../rule'

export default class extends Rule {
    static override id: 'JustifySelf' = 'JustifySelf' as const
    static override matches =  /^js:./
}