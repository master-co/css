import { dash, OFFSET, TEXT, UNDERLINE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class TextUnderlineOffset extends Style {
    static override key = dash(TEXT, UNDERLINE, OFFSET);
}