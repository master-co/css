import { MasterCSSRule } from '../rule';
import { BACKGROUND, BORDER, BOX, CLIP, CONTENT, dash, PADDING } from '../constants/css-property-keyword';

export class BackgroundClip extends MasterCSSRule {
    static override matches = /^(bg|background):text(?!\|)/;
    static override propName = dash(BACKGROUND, CLIP);
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}