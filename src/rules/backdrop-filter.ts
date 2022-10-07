import { MasterCSSRule } from '../rule';
import { BACKDROP, BLUR, dash, DEG, DROP, FILTER, HUE, REM, ROTATE, SHADOW } from '../constants/css-property-keyword';
import { parseValueUnit } from '../utils/parse-value-unit';

export class BackdropFilter extends MasterCSSRule {
    static override matches = /^bd:./;
    static override key = dash(BACKDROP, FILTER);
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            'backdrop-filter': propertyInfo,
            '-webkit-backdrop-filter': propertyInfo
        }
    };
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