import { Style } from '../style';
import { BACKGROUND, CLIP, dash } from '../constants/css-property-keyword';

export class BackgroundClip extends Style {
    static override matches = /^(bg|background):text(?!\|)/;
    static override key = dash(BACKGROUND, CLIP);
    override get props(): { [key: string]: any } {
        return {
            '-webkit-background-clip': this,
            'background-clip': this
        }
    }
}