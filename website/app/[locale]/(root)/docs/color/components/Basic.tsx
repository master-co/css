'use client'

import clsx from 'clsx'
import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import { useState } from 'react'
import usePreviewSyntax from '~/utils/use-selected-preview-syntax'

export default (props: any) =>
    <>
        <Demo>
            <p {...props} className={clsx('font:20 font:medium m:0', props.className)}>
                Heavy boxes perform quick waltzes and jigs.
            </p>
        </Demo>
        <Code lang="html">{`<p class="**${props.className}**">Heavy boxes perform quick waltzes and jigs.</p>`}</Code>
    </>