import { COLOR, CURRENT_COLOR, dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextDecorationColor extends Style {
    static override key = dash(TEXT, DECORATION, COLOR);
    static override colorStarts = 'text-decoration:';
    static override colorful = true;
    static override values = {
        current: CURRENT_COLOR
    }
}