import config1 from './master-1.css'
import config2 from './master-2.css'

/** @type {import('../../../src').Config} */
const config = {
    extends: [
        config1,
        config2
    ],
    variables:  {
        third: '$color-black'
    },
    modes: {
        dark: {
            first: '$color-black',
            second: '$color-black',
            fourth: '$color-black'
        }
    }
}

export default config
