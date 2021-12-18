import { DASH, TEXT, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextTransformStyle extends Style {
    static override prefixes = /^(t(ext)?-transform:|t(ext)?:(uppercase|lowercase|capitalize))/;
    static override property = TEXT + DASH + TRANSFORM;
    static override supportFullName = false;
}