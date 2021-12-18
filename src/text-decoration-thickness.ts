import { DASH, DECORATION, TEXT, THICKNESS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationThicknessStyle extends Style {
    static override prefixes =  /^(t-decoration-thickness:|t(ext)?-decoration:[0-9]((?!;).)*$)/;
    static override property = TEXT + DASH + DECORATION + DASH + THICKNESS;
    static override unit = 'em';
}