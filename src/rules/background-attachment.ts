import { MasterCSSRule } from '../rule';
import { ATTACHMENT, BACKGROUND, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundAttachment'
    static override matches = /^(bg|background):(fixed|local|scroll)(?!\|)/;
    static override propName = dash(BACKGROUND, ATTACHMENT);
}