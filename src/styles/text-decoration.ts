import { dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecoration extends Style {
    static override matches = /^t(ext)?:(underline|line-through|overline)/;
    static override key = dash(TEXT, DECORATION);
    static override colorful = true;
    override order = -1;
}