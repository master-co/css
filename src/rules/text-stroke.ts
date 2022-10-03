import { MasterCSSRule } from '../rule';

export class TextStroke extends MasterCSSRule {
    static id = 'textStroke';
    static override matches = /^text-stroke:./;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-stroke': this
        };
    }
}