import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextOverflow'
    static override matches = /^(text-(overflow|ovf):.|t(ext)?:(ellipsis|clip)(?!\|))/
    static override propName = 'text-overflow'
}