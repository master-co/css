import { COLOR, CURRENT_COLOR } from '../constants/css-property-keyword';
import { Style } from '../style';

export class FontColor extends Style {
    static override matches = /^(font-color:.|font:current)/;
    static override colorStarts = '(?:f(ont)?|color):';
    static override colorful = true;
    static override key = COLOR;
    static override unit = '';
    static override values = {
        current: CURRENT_COLOR
    }
}