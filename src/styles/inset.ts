import { Style } from '../style';

export class Inset extends Style {
    static override matches = /^(?:top|bottom|left|right):./;
    static override key = 'inset';
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}