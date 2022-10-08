import { MasterCSSRule } from '../rule';
import { ATTACHMENT, BACKGROUND, dash } from '../constants/css-property-keyword';

export class BackgroundAttachment extends MasterCSSRule {
    static override matches = /^(bg|background):(fixed|local|scroll)(?!\|)/;
    static override propName = dash(BACKGROUND, ATTACHMENT);
}