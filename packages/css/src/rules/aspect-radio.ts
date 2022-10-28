import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AspectRadio'
    static override matches = /^aspect:./
    static override propName = 'aspect-ratio'
    static override unit = ''
}