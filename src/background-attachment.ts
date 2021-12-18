import { Style } from '@master/style';
import { ATTACHMENT, BACKGROUND, DASH } from './constants/css-property-keyword';

export class BackgroundAttachmentStyle extends Style {
    static override prefixes = /^((bg|background)-attachment:|(bg|background):(fixed|local|scroll))/;
    static override property = BACKGROUND + DASH + ATTACHMENT;
    static override supportFullName = false;

}