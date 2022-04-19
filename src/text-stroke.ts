import { Style } from '@master/style';

export class TextStroke extends Style {
    static id = 'textStroke';
    static override matches = /^text-stroke:./;
    override get props(): { [key: string]: any } {
        return {
            'text-stroke': this,
            '-webkit-text-stroke': this
        };
    }
}