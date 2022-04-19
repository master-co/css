import { Style } from '@master/style';
import { BACKGROUND, CLIP, DASH } from './constants/css-property-keyword';

export class BackgroundClip extends Style {
    static override matches = /^(bg|background):text(?!;)/;
    static override key = BACKGROUND + DASH + CLIP;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-background-clip': this,
            'background-clip': this
        }
    }
}