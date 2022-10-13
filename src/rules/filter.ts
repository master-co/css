import { MasterCSSRule } from '../rule';
import { parseValueUnit } from '../utils/parse-value-unit';

export default class extends MasterCSSRule {
    static override id = 'Filter'
    static override matches = /^(blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/
    static override propName = 'filter';
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