import { Fragment } from 'react'
import { manifestUtilities, utilityUsesVariableNamespace } from '~/site/utils/manifest-utilities'

const utilities = manifestUtilities

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
