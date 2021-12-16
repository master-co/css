import { DASH, FONT, WEIGHT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontWeightStyle extends Style {
    static override prefixes =  /^f(ont)?-weight:/;
    static override properties = [FONT + DASH + WEIGHT];
    static override supportFullName = false;
    static override defaultUnit = '';
}

FontWeightStyle.values = {};
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