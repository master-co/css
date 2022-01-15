import { DASH, DECORATION, LINE, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationLineStyle extends Style {
    static override matches =  /^text-decoration:(none|underline|overline|line-through|blink)(?!;)/;
    static override key = TEXT + DASH + DECORATION + DASH + LINE;
}