import type { IframeHTMLAttributes } from 'react'
import Demo from './Demo'
import DemoViewport from './DemoViewport'

/** Site-owned example pages share the same keyboard-accessible viewport controls. */
export function DemoPageViewport({ src, title, height = 420 }: { src: string, title: string, height?: number }) {
  return <Demo title={title} frame="none" caption="Adjust the iframe viewport. Scroll inside the preview to see all content.">
    <DemoViewport src={src} title={title} height={height} responsive theme />
  </Demo>
}

export function DemoBrowserHeader({ url }: { url?: string }) {
  return <div className="ui-browser-bar">
    <span className="ui-browser-dots" aria-hidden="true"><i /><i /><i /></span>
    {url && <span className="ui-browser-url">{url}</span>}
  </div>
}

/** A native iframe in browser chrome. */
export function DemoIFrame({ showHeader = true, title, scrolling = 'no', ...props }: IframeHTMLAttributes<HTMLIFrameElement> & { showHeader?: boolean }) {
  return <Demo frame="none">
    <div className="ui-browser">
      {showHeader && <DemoBrowserHeader url={props.src} />}
      <div className="ui-browser-body"><div className="ui-browser-viewport">
        <iframe {...props} title={title ?? `Example: ${props.src}`} scrolling={scrolling} />
      </div></div>
    </div>
  </Demo>
}

export function DemoHelloWorld({ url = 'localhost:8080' }: { url?: string }) {
  return <Demo frame="none">
    <div className="ui-browser">
      <DemoBrowserHeader url={url} />
      <div className="grid (place-items:center) p-lg p-2xl@sm ui-browser-body"><h1 className="m(0) italic font-4xl font-heavy text-center fg-text-strong font-5xl@sm">Hello World</h1></div>
    </div>
  </Demo>
}
