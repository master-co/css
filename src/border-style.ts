import { Style } from '@master/style';
import { STYLE } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderStyleStyle extends Style {
    static override matches = /^b((x|y|t|b|l|r|order)|order(-(left|right|top|bottom))?-style)?:(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!;)/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, STYLE);
    }
}