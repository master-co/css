import { MasterVirtualClass } from './virtual-class';

export class MasterVariableVirtualClass extends MasterVirtualClass {
    static override prefixes = /^\$.*:/;
    override get properties(): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: this
        }
    }
}