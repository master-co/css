import { Style } from '../style';
import { BACKDROP, BLUR, dash, DEG, DROP, FILTER, HUE, REM, ROTATE, SHADOW } from '../constants/css-property-keyword';
import { parseValueUnit } from '../utils/parse-value-unit';

export class BackdropFilter extends Style {
    static override matches = /^bd:./;
    static override key = dash(BACKDROP, FILTER);
    static override colorful = true;
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
                    case dash(DROP, SHADOW):
                        return REM;
                    case dash(HUE, ROTATE):
                        return DEG;
                }

                return '';
            });
    }
}