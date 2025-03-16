'use client'

import useSelectedPreviewSyntax from 'internal/uses/use-selected-preview-syntax'
import BasicDemo from './BasicDemo'

export default (props: any) => {
    return (
        <BasicDemo className={useSelectedPreviewSyntax(props.className)} />
    )
}