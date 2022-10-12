import { BLUR, dash, DEG, DROP, FILTER, HUE, REM, ROTATE, SHADOW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';
import { parseValueUnit } from '../utils/parse-value-unit';

export default class extends MasterCSSRule {
    static override id = 'Filter'
    static override matches = /^(blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/
    static override propName = FILTER;
    override parseValue(value: string): string {
        return parseValueUnit(
            value,
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