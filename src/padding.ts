import { Style } from '@master/style';
import { PADDING } from './constants/css-property-keyword';

export class Padding extends Style {
    static id = 'padding';
    static override matches = /^padding(-(left|right|top|bottom))?:./;
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
    override get order(): number {
        return (this.prefix === PADDING + ':') ? -1 : 0;
    }
}