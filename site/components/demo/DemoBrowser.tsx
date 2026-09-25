import '~/site/styles/demo.css'
import type { IframeHTMLAttributes } from 'react'
import clsx from 'clsx'
import Demo from './Demo'
import { DemoLabel } from './primitives'
import DemoViewport from './DemoViewport'

/** Site-owned example pages share the same keyboard-accessible viewport controls. */
export function DemoPageViewport({ src, title, height = 420 }: { src: string, title: string, height?: number }) {
  return <Demo title={title} padding="none" background="plain" caption="Adjust the iframe viewport. Scroll inside the preview to see all content.">
    <DemoViewport src={src} title={title} height={height} responsive theme />
  </Demo>
}

export function DemoBrowserHeader({ url }: { url?: string }) {
  return <div className="demo-browser-header">
    <span className="demo-browser-dots" aria-hidden="true"><i /><i /><i /></span>
    <DemoLabel>{url}</DemoLabel>
  </div>
}

/** Keeps the existing ResizeZone and native iframe behavior, with site-owned chrome. */
export function DemoIFrame({ showHeader = true, title, className, scrolling = 'no', ...props }: IframeHTMLAttributes<HTMLIFrameElement> & { showHeader?: boolean }) {
  return <Demo padding="none" background="plain">
    {showHeader && <DemoBrowserHeader url={props.src} />}
    <iframe {...props} title={title ?? `Example: ${props.src}`} scrolling={scrolling} className={clsx('demo-embedded-frame', className)} />
  </Demo>
}

export function DemoHelloWorld({ url = 'localhost:8080' }: { url?: string }) {
  return <Demo padding="none">
    <DemoBrowserHeader url={url} />
    <div className="p-lg p-2xl@sm"><h1 className="m:0 italic font-4xl font-heavy text-center text-strong font-5xl@sm">Hello World</h1></div>
  </Demo>
}
