import { dash, DECORATION, LINE, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationLine extends Style {
    static override matches = /^t(ext)?:(none|underline|overline|line-through)(?!;)/;
    static override key = dash(TEXT, DECORATION, LINE);
}