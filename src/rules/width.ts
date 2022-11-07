import Rule from '../rule'

export default class extends Rule {
    static override id: 'Width' = 'Width' as const
    static override matches = /^w:./
}