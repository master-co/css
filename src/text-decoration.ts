import { DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationStyle extends Style {
    static override prefixes =  /^(t(ext)?-decoration:|t(ext)?:(underline|line-throught))/;
    static override key = TEXT + DASH + DECORATION;
}