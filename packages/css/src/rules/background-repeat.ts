import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundRepeat'
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/
    static override propName = 'background-repeat'
}