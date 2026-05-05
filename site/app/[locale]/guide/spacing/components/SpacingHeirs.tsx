import { Fragment } from 'react'
import { utilities } from '@master/css'

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
