import { DASH, DEG, FILTER, REM, ROTATE, SHADOW } from './constants/css-property-keyword';
import { Style } from '@master/style';
import { parseValueUnit } from './utils/parse-value-unit';

export class FilterStyle extends Style {
    static override matches = /^blur\(.*?\)/
    static override key = FILTER;
    override get parseValue() {
        return parseValueUnit(
            this.value,
            method => {
                switch (method) {
                    case 'blur':
                    case 'drop' + DASH + SHADOW:
                        return REM;
                    case 'hue' + DASH + ROTATE:
                        return DEG;
                }

                return '';
            });
    }
}