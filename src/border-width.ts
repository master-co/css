import { Style } from '@master/style';
import { WIDTH } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderWidthStyle extends Style {
    static override matches = /^b((x|y|t|b|l|r|order)|order(-(left|right|top|bottom))?-width)?:[0-9]((?!;).)*$/;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, WIDTH);
    }

}