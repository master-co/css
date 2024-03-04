import CSSRuntimeProvider from '../src'
import { useState, useEffect, useRef } from 'react'
import type { Config } from '@master/css'
import React from 'react'

export default function Runtime() {
    const [config, setConfig] = useState<Config>({
        styles: {
            btn: 'b:2|red'
        }
    })
    const [root, setRoot] = useState<ShadowRoot>()
    const containerRef = useRef<HTMLDivElement>(null)
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot>()

    useEffect(() => {
        if (containerRef.current) {
            const newShadowRoot = containerRef.current.attachShadow({ mode: 'open' })

            const shadowContent = document.createElement('div')
            shadowContent.className = 'f:1000'
            newShadowRoot.appendChild(shadowContent)

            setShadowRoot(newShadowRoot)
        }
    }, [containerRef])

    return <CSSRuntimeProvider root={root} config={config}>
        <button id="config-btn" className="btn" onClick={() => setConfig({})}></button>
        <button id="root-btn" onClick={() => setRoot(shadowRoot)}></button>
        <div ref={containerRef}></div>
    </CSSRuntimeProvider>
}