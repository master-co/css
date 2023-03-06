import { Rule } from '../rule'

export class Background extends Rule {
    static id = 'Background' as const
    static matches = '^bg:.'
    static colorful = true
    override order = -1
}