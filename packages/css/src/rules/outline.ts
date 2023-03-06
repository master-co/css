import { Rule } from '../rule'

export class Outline extends Rule {
    static id = 'Outline' as const
    override order = -1
    static colorful = true
}