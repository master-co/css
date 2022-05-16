import { Style } from '../style';
import { BACKGROUND, BLEND, dash, MODE } from '../constants/css-property-keyword';

export class BackgroundBlendMode extends Style {
    static override key = dash(BACKGROUND , BLEND , MODE);
}