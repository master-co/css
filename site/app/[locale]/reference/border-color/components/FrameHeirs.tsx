import { Fragment } from 'react'
import { tokenFamilies } from '~/site/utils/manifest-utilities'

const families = tokenFamilies

export default () => <>
  {
    families
      .filter((family) => family.namespaces.includes('color-line'))
      .map((utility, index, arr) =>
        <Fragment key={utility.prefix}>
          <code>{utility.prefix}</code>
          {index !== arr.length - 1 && ', '}
        </Fragment>
      )
  }
</>
