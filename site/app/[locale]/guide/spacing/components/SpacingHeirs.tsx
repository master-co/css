import { Fragment } from 'react'
import { rules } from '@master/css'

export default () =>
    <p>
        {
            Object.keys(rules)
                .filter((ruleName) => (rules as any)[ruleName].namespaces?.find((variable: string) => variable.includes('spacing')))
                .map((ruleName, index, arr) =>
                    <Fragment key={ruleName}>
                        <code>{ruleName}</code>
                        {index !== arr.length - 1 && ', '}
                    </Fragment>
                )
        }
    </p>