import { Style } from '@master/style';
import { BORDER } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderStyle extends Style {
    static override matches = /^b((x|y|t|b|l|r)?|order(-(left|right|top|bottom))?):./;
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this);
    }
    override get order(): number {
        return (this.prefix === BORDER + ":" || this.prefix === 'b:') ? -2 : -1;
    }
}