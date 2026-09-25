'use client'

import '~/site/styles/btn.css'
import clsx from 'clsx'
import { useState } from 'react'
import { useTranslation } from '../contexts/i18n'

export default function ExpandContent(props: any) {
  const [expanded, setExpanded] = useState(false)
  const $ = useTranslation()
  return (
    <>
      <div {...props} className={clsx(props.className, {
        'overflow:hidden max-h:480px': !expanded,
        'overflow:auto': expanded,
      })}>
        {props.children}
      </div>
      <div className={clsx('rel flex items-center justify-center w:100% background-image:linear-gradient(transparent,var(--color-surface-base))', {
        'sticky bottom pb-md pt:1em': expanded,
        'mb:2em mt:-7.5rem pt:7.5rem': !expanded,
      })}>
        <button className={clsx('rounded outline:1px|solid|var(--color-line-subtle) outline-offset:0 surface-raised shadow-sm btn btn-sm', {
          'mt:-2rem': !expanded
        })} onClick={() => setExpanded(!expanded)}>{$(expanded ? 'Collapse' : 'Expand')}</button>
      </div>
    </>
  )
}
