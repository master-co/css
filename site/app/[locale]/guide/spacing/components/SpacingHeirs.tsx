import { Fragment } from 'react'
import { rules } from '@master/css'

export default () =>
    <p>
        {
            rules
                .filter((rule) => rule.namespaces?.find((variable) => variable.includes('spacing')))
                .map((rule, index, arr) =>
                    <Fragment key={rule.name}>
                        <code>{rule.name}</code>
                        {index !== arr.length - 1 && ', '}
                    </Fragment>
                )
        }
    </p>
