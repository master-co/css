import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecorationStyle'
    static override matches = /^t(ext)?:(solid|double|dotted|dashed|wavy)(?!\|)/
}