import Rule from '../rule'

export default class extends Rule {
    static override id = 'AlignContent'
    static override matches = /^ac:./
}