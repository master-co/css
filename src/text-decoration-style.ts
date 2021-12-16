import { DASH, DECORATION, STYLE, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextDecorationStyleStyle extends MasterStyle {
    static override prefixes =  /^(t(ext)?-decoration-style:|t(ext)?:(solid|double|dotted|dashed|wavy))/;
    static override properties = [TEXT + DASH + DECORATION + DASH + STYLE];
    static override supportFullName = false;
}