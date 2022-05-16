import { Style } from '../style';
import { BORDER, dash, WIDTH } from '../constants/css-property-keyword';
import { getBorderProps } from '../utils/get-border-props';

export class BorderWidth extends Style {
    static id = 'borderWidth';
    static override matches = /^(border(-(left|right|top|bottom))?-width:.|b([xytblr]|order(-(left|right|top|bottom))?)?:(([0-9]|(max|min|calc|clamp)\(.*\))|(max|min|calc|clamp)\(.*\))((?!;).)*$)/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, WIDTH);
    }
    override get order(): number {
        return (this.prefix === dash(BORDER, WIDTH) + ":" || this.prefix === 'b:' || this.prefix === BORDER + ':') ? -1 : 0;
    }
}