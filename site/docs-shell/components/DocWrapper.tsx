'use client'

import clsx from 'clsx'

export default function DocWrapper(props: any) {
  return (
    <div {...props} className={clsx('app-wrapper flex w:100%', props.className)}>
      {props.children}
    </div>
  )
}
