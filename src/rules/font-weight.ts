import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'FontWeight'
    static override matches = /^f(ont)?:(thin|extralight|light|regular|medium|semibold|bold|bolder|extrabold|heavy)(?!\|)/
    static override unit = ''
}