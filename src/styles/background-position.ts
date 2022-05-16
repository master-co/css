import { Style } from '@master/style';
import { BACKGROUND, dash, POSITION, PX } from '../constants/css-property-keyword';

export class BackgroundPosition extends Style {
    static override matches = /^(bg|background):(top|bottom|right|left|center)(?!;)/;
    static override key = dash(BACKGROUND, POSITION);
    static override unit = PX;
}