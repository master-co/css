import Rule from '../rule'

export default class extends Rule {
    static override id = 'MaskImage'
    override get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}