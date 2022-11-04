import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridColumnEnd'
    static override matches = /^grid-col-end:./
    static override unit = ''
}