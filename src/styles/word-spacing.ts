import { dash, SPACING, WORD } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WordSpacing extends Style {
    static override key = dash(WORD, SPACING);
    static override unit = 'em';
}