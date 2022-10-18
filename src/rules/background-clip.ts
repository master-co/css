import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundClip'
    static override matches = /^(bg|background):text(?!\|)/
    static override propName = 'background-clip'
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}