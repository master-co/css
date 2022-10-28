import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'MixBlendMode'
    static override matches = /^blend:./
    static override propName = 'mix-blend-mode'
}