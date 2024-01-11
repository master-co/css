'use client'

import useSelectedPreviewSyntax from '~/utils/use-selected-preview-syntax'
import Basic from './Basic'

export default (props: any) => {
    const selectedPreviewSyntax = useSelectedPreviewSyntax(props.className)
    return (
        <Basic className={selectedPreviewSyntax} />
    )
}