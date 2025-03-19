'use client'

import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default (props: any) =>
    <>
        <BasicDemo {...props} />
        <Code lang="html">{`
            <!-- @MARK ${props.className} -->
            <p class="${props.className}">Heavy boxes perform quick waltzes and jigs.</p>
        `}</Code>
    </>