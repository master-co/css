import { Fragment } from 'react'
import { rules } from '@master/css'

export default () => <>
    {
        Object.keys(rules)
            .filter((ruleName) => (rules as any)[ruleName].variables?.find((variable: string) => variable.includes('foreground')))
            .map((ruleName, index, arr) =>
                <Fragment key={ruleName}>
                    <code>{ruleName}</code>
                    {index !== arr.length - 1 && ', '}
                </Fragment>
            )
    }
</>