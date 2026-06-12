import { Fragment } from 'react'
import { planUtilities, utilityUsesVariableNamespace } from '~/site/utils/plan-utilities'

const utilities = planUtilities

export default () => <>
    {
        utilities
            .filter((utility) => utilityUsesVariableNamespace(utility, 'line'))
            .map((utility, index, arr) =>
                <Fragment key={utility.name}>
                    <code>{utility.name}</code>
                    {index !== arr.length - 1 && ', '}
                </Fragment>
            )
    }
</>
