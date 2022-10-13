import { MasterCSSRule } from '../rule';
import { getBorderProps } from '../utils/get-border-props';

export default class extends MasterCSSRule {
    static override id = 'BorderStyle'
    static override matches = /^(border(-(left|right|top|bottom))?-style:.|b([xytblr]|order(-(left|right|top|bottom))?)?:(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|))/;
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'style');
    }
    override get order(): number {
        return (this.prefix === 'border-style' + ":" || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0;
    }
}