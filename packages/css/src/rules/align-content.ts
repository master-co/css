import Rule from '../rule'

export default class extends Rule {
    static override id: 'AlignContent' = 'AlignContent' as const
    static override matches = /^ac:./
}