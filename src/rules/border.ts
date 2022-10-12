import { MasterCSSRule } from '../rule';
import { BORDER } from '../constants/css-property-keyword';
import { getBorderProps } from '../utils/get-border-props';

export default class extends MasterCSSRule {
    static override id = 'Border'
    static override matches = /^b([xytblr]?|order(-(left|right|top|bottom))?):./;
    static override colorful = true;
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration);
    }
    override get order(): number {
        return (this.prefix === BORDER + ":" || this.prefix === 'b:') ? -2 : -1;
    }
}