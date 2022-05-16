import { dash, DECORATION, STYLE, TEXT } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationStyle extends Style {
    static override matches = /^t(ext)?:(solid|double|dotted|dashed|wavy)(?!;)/;
    static override key = dash(TEXT, DECORATION, STYLE);
}