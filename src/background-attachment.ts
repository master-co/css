import { MasterStyle } from '@master/style';
import { ATTACHMENT, BACKGROUND, DASH } from './constants/css-property-keyword';

export class BackgroundAttachmentStyle extends MasterStyle {
    static override prefixes = /^((bg|background)-attachment:|(bg|background):(fixed|local|scroll))/;
    static override properties = [BACKGROUND + DASH + ATTACHMENT];
    static override supportFullName = false;

}