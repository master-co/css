import { MasterCSSRule } from '../rule';

export class TextStrokeWidth extends MasterCSSRule {
    static override matches = /^text-stroke(:((thin|medium|thick)(?!\|)|\.?\d((?!\|).)*$)|-width:.)/;
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        };
    }
}