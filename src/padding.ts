import { Style } from '@master/style';
import { PADDING } from './constants/css-property-keyword';

export class PaddingStyle extends Style {
    static override matches = /^padding(-(left|right|top|bottom))?:./;
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
    override get getOrder(): number {
        return (this.prefix === PADDING + ':') ? -1 : 0;
    }
}