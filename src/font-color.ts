import { COLOR } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontColorStyle extends Style {
    static override prefixes = /^((f(ont)?-)?color:)/;
    static override colorStarts = 'f(ont)?:';
    static override property = COLOR;
}