'use client'

import config from 'virtual:master-css-config'
import { CSSRuntimeProvider } from './CSSRuntimeProvider'
// fix: ReferenceError: React is not defined
import React from 'react'

export interface CSSRuntimeRegistryProps {
    children?: React.ReactNode
}

export function CSSRuntimeRegistry(props: CSSRuntimeRegistryProps) {
    return (
        <CSSRuntimeProvider config={config}>
            {props.children}
        </CSSRuntimeProvider>
    )
}
