'use client'

import plan from 'virtual:master-css-plan'
import preloaded from 'virtual:master-css-preloaded'
import { CSSRuntimeProvider } from './CSSRuntimeProvider'
// fix: ReferenceError: React is not defined
import React from 'react'

export interface CSSRuntimeRegistryProps {
    children?: React.ReactNode
}

export function CSSRuntimeRegistry(props: CSSRuntimeRegistryProps) {
    return (
        <CSSRuntimeProvider plan={plan} preloaded={preloaded}>
            {props.children}
        </CSSRuntimeProvider>
    )
}
