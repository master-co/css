import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'FlexWrap'
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!\|)/
    static override propName = 'flex-wrap'
}