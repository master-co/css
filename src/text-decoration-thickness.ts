import { DASH, DECORATION, TEXT, THICKNESS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationThickness extends Style {
    static override matches =  /^text-decoration:(from-font(?!;)|([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$)/;
    static override key = TEXT + DASH + DECORATION + DASH + THICKNESS;
    static override unit = 'em';
}