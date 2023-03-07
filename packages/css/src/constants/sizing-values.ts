import { breakpoints } from '../config'

const SIZING_VALUES = {
    full: '100%',
    fit: 'fit-content',
    max: 'max-content',
    min: 'min-content',
}

for (const key in breakpoints) {
    SIZING_VALUES[key] = (breakpoints[key] / 16) + 'rem'
}

export { SIZING_VALUES }