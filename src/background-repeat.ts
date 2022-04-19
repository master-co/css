import { Style } from '@master/style';
import { BACKGROUND, dash, REPEAT } from './constants/css-property-keyword';

export class BackgroundRepeat extends Style {
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/;
    static override key = dash(BACKGROUND, REPEAT);
}