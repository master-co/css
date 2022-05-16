import { Style } from '../style';

export class Group extends Style {
    static id = 'group';
    static override matches = /^{/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
        }
    }
}