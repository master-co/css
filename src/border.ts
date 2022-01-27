import { Style } from '@master/style';
import { getBorderProps } from './utils/get-border-props';

export class BorderStyle extends Style {
    static override matches = /^b((x|y|t|b|l|r)?|order(-(left|right|top|bottom))?):./;
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return getBorderProps(this.prefix, this);
    }
}