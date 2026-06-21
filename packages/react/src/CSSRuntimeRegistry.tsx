'use client'

import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
import { CSSRuntimeProvider } from './CSSRuntimeProvider'
// fix: ReferenceError: React is not defined
import React from 'react'

export interface CSSRuntimeRegistryProps {
    children?: React.ReactNode
}

export function CSSRuntimeRegistry(props: CSSRuntimeRegistryProps) {
    return (
        <CSSRuntimeProvider manifest={manifest} emittedGlobals={emittedGlobals}>
            {props.children}
        </CSSRuntimeProvider>
    )
}
