import { Style } from '@master/style';
import { BACKGROUND, DASH, REPEAT } from './constants/css-property-keyword';

export class BackgroundRepeatStyle extends Style {
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/;
    static override key = BACKGROUND + DASH + REPEAT;
}