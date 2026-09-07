import { Fragment } from 'react'
import { getVariableNamespacePublicKeys } from '~/site/utils/manifest-utilities'

const keys = getVariableNamespacePublicKeys('color-text')

export default () => <>
  {
    keys
      .map((key, index, arr) =>
        <Fragment key={key}>
          <code>{key}:</code>
          {index !== arr.length - 1 && ', '}
        </Fragment>
      )
  }
</>
