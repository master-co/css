import config1 from './master-1.css'
import config2 from './master-2.css'

/** @type {import('../../../src').Config} */
const config = {
    extends: [
        config1,
        config2
    ],
    variables:  {
        third: '$black'
    },
    modes: {
        dark: {
            first: '$black',
            second: '$black',
            fourth: '$black'
        }
    }
}

export default config
