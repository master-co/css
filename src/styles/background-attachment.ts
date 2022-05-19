import { Style } from '../style';
import { ATTACHMENT, BACKGROUND, dash } from '../constants/css-property-keyword';

export class BackgroundAttachment extends Style {
    static override matches = /^(bg|background):(fixed|local|scroll)(?!\|)/;
    static override key = dash(BACKGROUND, ATTACHMENT);
}