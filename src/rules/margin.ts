import { MasterCSSRule } from '../rule';
import { MARGIN } from '../constants/css-property-keyword';

export class Margin extends MasterCSSRule {
    static id = 'margin';
    static override matches = /^margin(-(left|right|top|bottom))?:./;
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: propertyInfo
        }
    }
    override get order(): number {
        return (this.prefix === MARGIN + ":") ? -1 : 0;
    }
}