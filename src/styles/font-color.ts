import { COLOR } from '../constants/css-property-keyword';
import { Style } from '../style';

export class FontColor extends Style {
    static override matches = /^font-color:./;
    static override colorStarts = 'f(ont)?:';
    static override colorful = true;
    static override key = COLOR;
    static override unit = '';
}