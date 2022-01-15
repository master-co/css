import { DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationStyle extends Style {
    static override matches =  /^t(ext)?:(underline|line-through|overline|blink)/;
    static override key = TEXT + DASH + DECORATION;
}