import { DASH, DECORATION, TEXT, THICKNESS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationThicknessStyle extends Style {
    static override matches =  /^(t-decoration-thickness:|t(ext)?-decoration:[0-9]((?!;).)*$)/;
    static override key = TEXT + DASH + DECORATION + DASH + THICKNESS;
    static override unit = 'em';
}