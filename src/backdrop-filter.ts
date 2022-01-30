import { Style } from '@master/style';
import { BLUR, DASH, DEG, DROP, HUE, REM, ROTATE, SHADOW } from './constants/css-property-keyword';
import { parseValueUnit } from './utils/parse-value-unit';

export class BackdropFilterStyle extends Style {
    static override matches = /^(bd|backdrop-filter):./;
    override get props(): { [key: string]: any } {
        return {
            'backdrop-filter': this,
            '-webkit-backdrop-filter': this
        }
    };
    override get parseValue() {
        return parseValueUnit(
            this.value,
            method => {
                switch (method) {
                    case BLUR:
                    case DROP + DASH + SHADOW:
                        return REM;
                    case HUE + DASH + ROTATE:
                        return DEG;
                }

                return '';
            });
    }
}