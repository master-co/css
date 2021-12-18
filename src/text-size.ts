import { DASH, FONT, HEIGHT, LINE, REM, SIZE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextSizeStyle extends Style {
    static override prefixes = /^(t(ext)?:[0-9]((?!;).)*$)/;
    override get properties(): { [key: string]: any } {
        return {
            [FONT + DASH + SIZE]: this,
            [LINE + DASH + HEIGHT]: {
                ...this,
                value: this.unit === REM
                    ? this.value + .375 + this.unit
                    : 'calc(' + this.value + this.unit + ' + .375rem)',
                unit: ''
            }
        };
    }
}