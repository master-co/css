import { MasterCSSRule } from '../rule';
import { MARGIN } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Margin'
    static override matches = /^margin(-(left|right|top|bottom))?:./;
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === MARGIN + ":") ? -1 : 0;
    }
}