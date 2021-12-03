import { MasterStyle } from '@master/style';

export class MasterVariableStyle extends MasterStyle {
    static override prefixes = /^\$.*:/;
    override get properties(): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: this
        }
    }
}