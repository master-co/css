import { DASH, FONT, F_PREFIX, WEIGHT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontWeightStyle extends MasterStyle {
    static override prefixes = /^f-weight:/;
    static override properties = [FONT + DASH + WEIGHT];
    static override defaultUnit = '';
}

let weight = 100;
for (const name of [
    'thin',
    'extralight',
    'light',
    'regular',
    'medium',
    'semibold',
    'bold',
    'extrabold',
    'heavy'
]) {
    FontWeightStyle.values[name] = weight;
    weight += 100;
}