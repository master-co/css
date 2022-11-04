import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BoxDecorationBreak'
    static override matches = /^box:(slice|clone)(?!\|)/
    override get(declaration): { [key: string]: any } {
        return {
            'box-decoration-break': declaration,
            '-webkit-box-decoration-break': declaration
        }
    }
}