import { Style } from '@master/style';
import { BORDER, COLOR, DASH } from './constants/css-property-keyword';
import { getBorderProps } from './utils/get-border-props';

export class BorderColor extends Style {
    static override matches = /^border(-(left|right|top|bottom))?-color:./;
    static override colorStarts = 'b([xytblr]|(order(-(left|right|top|bottom))?))?:';
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this, COLOR);
    }
    override get order(): number {
        return (this.prefix === BORDER + DASH + COLOR + ":" || this.prefix === 'b:' || this.prefix === BORDER + ':') ? -1 : 0;
    }
}