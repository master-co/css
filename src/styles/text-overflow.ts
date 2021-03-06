import { dash, OVERFLOW, TEXT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextOverflow extends Style {
    static override matches = /^(text-(overflow|ovf):.|t(ext)?:(ellipsis|clip)(?!\|))/;
    static override key = dash(TEXT, OVERFLOW);
}