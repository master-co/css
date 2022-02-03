import { Style } from '@master/style';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderWidthStyle extends Style {
    static override matches = /^(border(-(left|right|top|bottom))?-width:.|b(x|y|t|b|l|r|order(-(left|right|top|bottom))?)?:(([0-9]|(max|min|calc|clamp)\(.*\))|(max|min|calc|clamp)\(.*\))((?!;).)*$)/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, WIDTH);
    }
    override get getOrder(): number {
        return (this.prefix === BORDER + DASH + WIDTH + ":" || this.prefix === 'b:' || this.prefix === BORDER + ':') ? -1 : 0;
    }
}