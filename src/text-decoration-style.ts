import { DASH, DECORATION, STYLE, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationStyleStyle extends Style {
    static override prefixes =  /^(t(ext)?-decoration-style:|t(ext)?:(solid|double|dotted|dashed|wavy))/;
    static override property = TEXT + DASH + DECORATION + DASH + STYLE;
    static override supportFullName = false;
}