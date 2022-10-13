import { MasterCSSRule } from '../rule';
import { parseValueUnit } from '../utils/parse-value-unit';

export default class extends MasterCSSRule {
    static override id = 'BackdropFilter'
    static override matches = /^bd:./;
    static override propName = 'backdrop-filter';
    override get(declaration): { [key: string]: any } {
        return {
            'backdrop-filter': declaration,
            '-webkit-backdrop-filter': declaration
        }
    };
    override parseValue(value: string): string {
        return parseValueUnit(
            value,
            method => {
                switch (method) {
                    case 'blur':
                    case 'drop-shadow':
                        return 'rem';
                    case 'hue-rotate':
                        return 'deg';
                }
                return '';
            });
    }
}