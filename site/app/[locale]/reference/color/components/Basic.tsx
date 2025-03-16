'use client'

import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) =>
    <>
        <BasicDemo className={className} />
        <Code lang="html">{`<p class="**${className}**">Heavy boxes perform quick waltzes and jigs.</p>`}</Code>
    </>