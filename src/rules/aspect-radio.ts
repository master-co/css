import Rule from '../rule'

export default class extends Rule {
    static override id = 'AspectRadio'
    static override matches = /^aspect:./
    static override unit = ''
}