import { DASH, FONT, F_PREFIX, WEIGHT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontWeightStyle extends MasterStyle {
    static override prefixes =  /^(f|font)-weight:/;
    static override properties = [FONT + DASH + WEIGHT];
    static override defaultUnit = '';
    static override semantics = {
        [F_PREFIX + 'thin']: 100,
        [F_PREFIX + 'extralight']: 200,
        [F_PREFIX + 'light']: 300,
        [F_PREFIX + 'regular']: 400,
        [F_PREFIX + 'medium']: 500,
        [F_PREFIX + 'semibold']: 600,
        [F_PREFIX + 'bold']: 700,
        [F_PREFIX + 'extrabold']: 800,
        [F_PREFIX + 'heavy']: 900
    }
}