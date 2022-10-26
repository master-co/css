import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationIterationCount'
    static override matches = /^@iteration-count:./
    static override propName = 'animation-interation-count'
    static override unit = ''
}