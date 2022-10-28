import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BoxShadow'
    static override matches = /^s(?:hadow)?:./
    static override propName = 'box-shadow'
    static override colorful = true
}