import { Style } from '@master/style';
import { STYLE } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderStyleStyle extends Style {
    static override matches = /^(border(-(left|right|top|bottom))?-style:.|b(x|y|t|b|l|r|order(-(left|right|top|bottom))?)?:(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!;))/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, STYLE);
    }
}