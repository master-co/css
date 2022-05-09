import { Style } from '@master/style';
import { BORDER, dash, IMAGE, WIDTH } from './constants/css-property-keyword';

export class BorderImageWidth extends Style {
    static override matches = /^border-image:(?:\.?[0-9]|(max|min|calc|clamp)\(.*\))(?:(?!;).)*$/;
    static override key = dash(BORDER, IMAGE, WIDTH);
}