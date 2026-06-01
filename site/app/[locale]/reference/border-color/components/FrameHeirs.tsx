import { Fragment } from 'react'
import config from '@master/css/config'

const utilities = config.utilities || []

export default () => <>
    {
        utilities
            .filter((utility) => utility.namespaces?.find((variable) => variable.includes('line')))
            .map((utility, index, arr) =>
                <Fragment key={utility.name}>
                    <code>{utility.name}</code>
                    {index !== arr.length - 1 && ', '}
                </Fragment>
            )
    }
</>
