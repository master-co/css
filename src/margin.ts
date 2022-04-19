import { Style } from '@master/style';
import { MARGIN } from './constants/css-property-keyword';

export class Margin extends Style {
    static id = 'margin';
    static override matches = /^margin(-(left|right|top|bottom))?:./;
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
    override get order(): number {
        return (this.prefix === MARGIN + ":") ? -1 : 0;
    }
}