import { MasterVirtualClass } from './virtual-class';
import { ATTACHMENT, BACKGROUND, DASH } from './constants/css-property-keyword';

export class MasterBackgroundAttachmentVirtualClass extends MasterVirtualClass {
    static override prefixes = /^bg-attachment:(bg:(fixed|local|scroll))/;
    static override properties = [BACKGROUND + DASH + ATTACHMENT];
}