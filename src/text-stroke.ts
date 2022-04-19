import { Style } from '@master/style';

export class TextStrokeStyle extends Style {
    static override matches = /^text-stroke:./;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-stroke': this
        };
    }
}