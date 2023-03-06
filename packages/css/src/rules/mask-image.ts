import { Rule } from '../rule'

export class MaskImage extends Rule {
    static override id = 'MaskImage' as const
    override get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}