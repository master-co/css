import { MasterCSSRule } from '../rule';

export class TextStrokeColor extends MasterCSSRule {
    static override matches = /^text-stroke-color:./;
    static override colorStarts = 'text-stroke:';
    static override colorful = true;
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': declaration
        };
    }
}