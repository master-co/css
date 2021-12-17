import { DASH, FONT, FONT_PREFIX, F_PREFIX, WEIGHT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontWeightStyle extends Style {
    static override prefixes = /^f(ont)?-weight:/;
    static override properties = [FONT + DASH + WEIGHT];
    static override supportFullName = false;
    static override unit = '';
    static override values = {};
    static override semantics = {};
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
    FontWeightStyle.semantics[F_PREFIX + name] = weight;
    FontWeightStyle.semantics[FONT_PREFIX + name] = weight;
    weight += 100;
}