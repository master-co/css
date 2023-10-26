import classCollision from './rules/class-collision'
import classOrder from './rules/class-order'
import classValidation from './rules/class-validation'

const plugin = {
    rules: {
        'class-collision': classCollision,
        'class-order': classOrder,
        'class-validation': classValidation
    }
}

export default plugin