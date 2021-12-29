import { Style } from '@master/style';
import { ATTACHMENT, BACKGROUND, DASH } from './constants/css-property-keyword';

export class BackgroundAttachmentStyle extends Style {
    static override matches = /^(bg-attachment:.|(bg|background):(fixed|local|scroll)(?!;))/;
    static override key = BACKGROUND + DASH + ATTACHMENT;
}