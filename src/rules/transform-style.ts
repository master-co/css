import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TransformStyle'
    static override matches = /^transform:(flat|preserve-3d)(?!\|)/
}