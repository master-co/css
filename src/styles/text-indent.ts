import { dash, INDENT, TEXT } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class TextIndent extends Style {
    static override key = dash(TEXT, INDENT);
}