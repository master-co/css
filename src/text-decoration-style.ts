import { DASH, DECORATION, STYLE, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationStyleStyle extends Style {
    static override matches =  /^t(ext)?:(solid|double|dotted|dashed|wavy)(?!;)/;
    static override key = TEXT + DASH + DECORATION + DASH + STYLE;
}