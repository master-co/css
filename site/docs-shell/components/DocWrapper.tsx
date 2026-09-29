'use client'

import '~/site/styles/docs-shell/wrapper.css'
import clsx from 'clsx'

export default function DocWrapper(props: any) {
  return (
    <div {...props} className={clsx('display:flex width:100% app-wrapper', props.className)}>
      {props.children}
    </div>
  )
}
