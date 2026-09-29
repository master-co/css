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
        'overflow:hidden max-height:480px': !expanded,
        'overflow:auto': expanded,
      })}>
        {props.children}
      </div>
      <div className={clsx('position:relative display:flex align-items:center justify-content:center width:100% background-image:linear-gradient(transparent,var(--color-surface-base))', {
        'position:sticky bottom:0 pb-md padding-top:1em': expanded,
        'margin-bottom:2em margin-top:-7.5rem padding-top:7.5rem': !expanded,
      })}>
        <button className={clsx('border-radius:1e9em outline:1px|solid|var(--color-line-subtle) outline-offset:0 surface-raised shadow-sm btn btn-sm', {
          'margin-top:-2rem': !expanded
        })} onClick={() => setExpanded(!expanded)}>{$(expanded ? 'Collapse' : 'Expand')}</button>
      </div>
    </>
  )
}
