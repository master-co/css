import { Style } from '@master/style';
import { DASH, SHADOW, TEXT } from './constants/css-property-keyword';

export class TextShadowStyle extends Style {
    static override prefixes = /^t(ext)?-shadow:/;
    static override property = TEXT + DASH + SHADOW;
    static override supportFullName = false;
}