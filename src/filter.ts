import { BLUR, dash, DEG, DROP, FILTER, HUE, REM, ROTATE, SHADOW } from './constants/css-property-keyword';
import { Style } from '@master/style';
import { parseValueUnit } from './utils/parse-value-unit';

export class Filter extends Style {
    static override matches = /^(blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/
    static override key = FILTER;
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