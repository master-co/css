import { DASH, DECORATION, TEXT, THICKNESS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationThicknessStyle extends Style {
    static override prefixes =  /^(t(ext)?-decoration-thickness:|t(ext)?:(auto))/;
    static override properties = [TEXT + DASH + DECORATION + DASH + THICKNESS];
    static override defaultUnit = 'px';
    static override supportFullName = false;
}