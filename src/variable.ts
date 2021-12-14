import { MasterStyle } from '@master/style';

export class VariableStyle extends MasterStyle {
    static override prefixes = /^\$(.*):/;
    override get properties(): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(2, -2)]: this
        }
    }
}