import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundClip'
    static override matches = /^(bg|background):text(?!\|)/
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}