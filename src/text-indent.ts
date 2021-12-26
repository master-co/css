import { DASH, INDENT, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextIndentStyle extends Style {
    static override matches =  /^t(ext)?-indent:./;
    static override key = TEXT + DASH + INDENT;
}