import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Spacing'
    static override matches = /^[pm][xytblr]?:./;
    override get(declaration): { [key: string]: any } {
        const charAt1 = this.prefix[0];
        const SPACING = charAt1 === 'm' ? 'margin' : 'padding';
        const SPACING_LEFT = SPACING + '-left'
        const SPACING_RIGHT = SPACING + '-right'
        const SPACING_TOP = SPACING + '-top'
        const SPACING_BOTTOM = SPACING + '-bottom'
        switch (this.prefix[1]) {
            case 'x':
                return {
                    [SPACING_LEFT]: declaration,
                    [SPACING_RIGHT]: declaration
                }
            case 'y':
                return {
                    [SPACING_TOP]: declaration,
                    [SPACING_BOTTOM]: declaration
                }
            case 'l':
                return {
                    [SPACING_LEFT]: declaration
                }
            case 'r':
                return {
                    [SPACING_RIGHT]: declaration
                }
            case 't':
                return {
                    [SPACING_TOP]: declaration
                }
            case 'b':
                return {
                    [SPACING_BOTTOM]: declaration
                }
            default:
                return {
                    [SPACING]: declaration
                }
        }
    }
    override get order(): number {
        return (this.prefix === 'p:' || this.prefix === 'm:') ? -1 : 0;
    }
}