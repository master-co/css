import { Style } from '@master/style';
import { ATTACHMENT, BACKGROUND, DASH } from './constants/css-property-keyword';

export class BackgroundAttachment extends Style {
    static override matches = /^(bg|background):(fixed|local|scroll)(?!;)/;
    static override key = BACKGROUND + DASH + ATTACHMENT;
}