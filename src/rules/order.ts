import MasterCSSRule from '../rule'

const extreme = '999999'

export default class extends MasterCSSRule {
    static override id = 'Order'
    static override matches = /^o:./
    static override unit = ''
}