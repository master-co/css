'use client'

import clsx from 'clsx'
import Demo from 'internal/components/Demo'

export default (props: any) =>
    <Demo>
        <p {...props} className={clsx('font:20 font:medium m:0', props.className)}>
            Heavy boxes perform quick waltzes and jigs.
        </p>
    </Demo>
