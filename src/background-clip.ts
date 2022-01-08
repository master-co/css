import { Style } from '@master/style';

export class BackgroundClipStyle extends Style {
    static override matches = /^background-clip:.|(bg|background):text(?!;)/;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-background-clip': this,
            'background-clip': this
        }
    }
}