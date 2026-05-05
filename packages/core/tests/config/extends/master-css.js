import config1 from './master-1.css'
import config2 from './master-2.css'

/** @type {import('../../../src').Config} */
const config = {
    extends: [
        config1,
        config2
    ],
    variables: [
        { key: 'third', value: '$color-black' },
        { key: 'first', value: '$color-black', mode: 'dark' },
        { key: 'second', value: '$color-black', mode: 'dark' },
        { key: 'fourth', value: '$color-black', mode: 'dark' },
    ],
    modes: ['dark']
}

export default config
