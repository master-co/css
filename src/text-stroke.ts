import { Style } from '@master/style';

export class TextStroke extends Style {
    static override matches = /^text-stroke:./;
    override get props(): { [key: string]: any } {
        return {
            'text-stroke': this,
            '-webkit-text-stroke': this
        };
    }
}