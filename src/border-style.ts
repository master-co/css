import { Style } from '@master/style';
import { STYLE } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderStyleStyle extends Style {
    static override matches = /^(border-style:.|b((x|y|t|b|l|r|order)|order-(left|right|top|bottom)-style)?:[0-9]((?!;).)*$)/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, STYLE);
    }
}