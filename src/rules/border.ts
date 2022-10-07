import { MasterCSSRule } from '../rule';
import { BORDER } from '../constants/css-property-keyword';
import { getBorderProps } from '../utils/get-border-props';

export class Border extends MasterCSSRule {
    static id = 'border';
    static override matches = /^b([xytblr]?|order(-(left|right|top|bottom))?):./;
    static override colorful = true;
    override getProps(propertyInfo): { [key: string]: any } {
        return getBorderProps(this.prefix, propertyInfo);
    }
    override get order(): number {
        return (this.prefix === BORDER + ":" || this.prefix === 'b:') ? -2 : -1;
    }
}