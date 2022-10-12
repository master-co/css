import { MasterCSSRule } from '../rule';
import { BACKGROUND, BORDER, BOX, CLIP, CONTENT, dash, PADDING } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundClip'
    static override matches = /^(bg|background):text(?!\|)/;
    static override propName = dash(BACKGROUND, CLIP);
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}