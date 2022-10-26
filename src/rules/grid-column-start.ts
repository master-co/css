import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridColumnStart'
    static override matches = /^grid-col-start:./
    static override propName = 'grid-column-start'
    static override unit = ''
}