import { Fragment } from 'react'
import config from '@master/css/config'

const utilities = config.utilities || []

export default () =>
    <p>
        {
            utilities
                .filter((utility) => utility.namespaces?.find((variable) => variable.includes('spacing')))
                .map((utility, index, arr) =>
                    <Fragment key={utility.name}>
                        <code>{utility.name}</code>
                        {index !== arr.length - 1 && ', '}
                    </Fragment>
                )
        }
    </p>
