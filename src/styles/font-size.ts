import { dash, FONT, SIZE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class FontSize extends Style {
    static override matches = /^f(ont)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/;
    static override key = dash(FONT, SIZE);
}