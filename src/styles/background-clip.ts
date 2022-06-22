import { Style } from '../style';
import { BACKGROUND, BORDER, BOX, CLIP, CONTENT, dash, PADDING } from '../constants/css-property-keyword';

export class BackgroundClip extends Style {
    static override matches = /^(bg|background):text(?!\|)/;
    static override key = dash(BACKGROUND, CLIP);
    override get props(): { [key: string]: any } {
        return {
            '-webkit-background-clip': this,
            'background-clip': this
        }
    }
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX),
        padding: dash(PADDING, BOX)
    }
}