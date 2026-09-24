'use client'

import clsx from 'clsx'

export default function DocWrapper(props: any) {
  return (
    <div {...props} className={clsx('app-wrapper flex w:full', props.className)}>
      {props.children}
    </div>
  )
}
