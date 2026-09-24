'use client'

import useSelectedPreviewSyntax from '~/site/docs-shell/uses/use-selected-preview-syntax'
import BasicDemo from './BasicDemo'

export default (props: any) => {
  return (
    <BasicDemo className={useSelectedPreviewSyntax(props.className)} />
  )
}