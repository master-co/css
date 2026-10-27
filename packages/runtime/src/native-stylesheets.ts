import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX, type MasterCSSRuntimeStylesheetAsset } from '@master/css-schema/runtime-style'
import type { MasterCSSRuntimeOptions } from './types'

interface Asset {
  active: boolean
  blobs: Set<string>
  content: Promise<string | undefined>
}

/** DOM delivery only. CSS syntax, dependency selection and URL edits come from Rust. */
export default class NativeStylesheets {
  private readonly attached = new Map<HTMLLinkElement, { href: string, assetHref?: string, style?: HTMLStyleElement, disabled: boolean }>()
  private readonly assets = new Map<string, Asset>()
  private disposed = false

  constructor(
    private readonly root: Document | ShadowRoot,
    private readonly delivery: MasterCSSRuntimeOptions['stylesheetDelivery'],
    private readonly changed: () => void
  ) {}

  private get document() { return this.root.nodeType === 9 ? this.root as Document : this.root.ownerDocument! }

  private owns(href: string) {
    if (!this.delivery) return false
    const base = new URL(this.delivery.base, this.document.baseURI)
    const target = new URL(href, this.document.baseURI)
    return target.origin === base.origin && target.pathname.startsWith(base.pathname)
  }

  private async content(href: string, asset: Asset, ancestors: readonly string[] = []): Promise<string | undefined> {
    if (ancestors.includes(href)) return ''
    const descriptorURL = new URL(href)
    descriptorURL.pathname += MASTER_CSS_STYLESHEET_ASSET_SUFFIX
    const response = await fetch(descriptorURL)
    // An adapter base can also contain user-served CSS. An absent root sidecar
    // does not grant ownership; compiler-declared child assets must exist.
    if (response.status === 404 && !ancestors.length) return undefined
    if (!response.ok) throw new Error(`Cannot load owned Master CSS stylesheet: ${response.url} (${response.status})`)
    const descriptor = await response.json() as MasterCSSRuntimeStylesheetAsset
    if (descriptor.version !== 1 || typeof descriptor.css !== 'string' || !Array.isArray(descriptor.urls)) {
      throw new Error('Unsupported Master CSS stylesheet asset. Recompile the stylesheet and runtime together.')
    }
    let css = descriptor.css
    for (const reference of descriptor.urls) {
      let url = new URL(reference.url, href).href
      if (reference.stylesheet && this.owns(url)) {
        const child = await this.content(url, asset, [...ancestors, href])
        if (this.disposed || !asset.active) throw new Error('Stylesheet delivery was disposed')
        url = URL.createObjectURL(new Blob([child!], { type: 'text/css' }))
        asset.blobs.add(url)
      }
      // Percent encoding belongs to URL transport; the CSS placeholder and its
      // quoting were emitted by Rust. No CSS tokens are interpreted here.
      url = url.replace(/[()'"\\\s]/g, character => encodeURIComponent(character).replace(/[()']/g, c => '%' + c.charCodeAt(0).toString(16)))
      css = css.replaceAll(reference.placeholder, url)
    }
    return css
  }

  private attach(link: HTMLLinkElement) {
    const href = link.href
    const previous = this.attached.get(link)
    if (previous?.href === href) return
    const sibling = link.previousElementSibling as HTMLStyleElement | null
    if (!previous && sibling?.localName === 'style' && sibling.dataset.masterCssStylesheet
      && new URL(sibling.dataset.masterCssStylesheet, this.document.baseURI).href === href && sibling.sheet) {
      this.attached.set(link, { href, disabled: false, style: sibling })
      link.disabled = true
      return
    }
    const state = { href, assetHref: previous?.assetHref, disabled: previous?.disabled ?? link.disabled, style: previous?.style }
    this.attached.set(link, state)
    let asset = this.assets.get(href)
    if (!asset) {
      asset = { active: true, blobs: new Set(), content: Promise.resolve(undefined) }
      asset.content = this.content(href, asset)
      this.assets.set(href, asset)
    }
    const owned = asset
    void asset.content.then(css => {
      if (css === undefined || this.disposed || !link.isConnected || this.attached.get(link) !== state) return
      const style = this.document.createElement('style')
      style.dataset.masterCssStylesheet = href
      style.media = link.media
      style.title = link.title
      style.nonce = link.nonce
      style.textContent = css
      style.addEventListener('load', this.changed)
      link.before(style)
      if (!style.sheet) {
        style.remove()
        throw new Error('The document blocked its owned Master CSS stylesheet')
      }
      style.sheet.disabled = state.disabled
      style.addEventListener('error', () => {
        if (state.style !== style) return
        style.remove()
        state.style = undefined
        link.disabled = state.disabled
        this.changed()
      })
      previous?.style?.remove()
      state.style = style
      state.assetHref = href
      link.disabled = true
      this.collectAssets()
      this.changed()
    }).catch(error => { if (!this.disposed && owned.active) console.error(error) })
  }

  private collectAssets() {
    const used = new Set([...this.attached.values()].flatMap(state => [state.href, state.assetHref]))
    for (const [href, asset] of this.assets) {
      if (used.has(href)) continue
      asset.active = false
      for (const blob of asset.blobs) URL.revokeObjectURL(blob)
      this.assets.delete(href)
    }
  }

  sheets(): CSSStyleSheet[] {
    for (const [link, state] of this.attached) {
      if (link.isConnected && this.owns(link.href)) continue
      state.style?.remove()
      link.disabled = state.disabled
      this.attached.delete(link)
    }
    this.collectAssets()
    const result: CSSStyleSheet[] = []
    // Inline CSS is same-document data. External sheets are considered only
    // when the adapter explicitly owns their delivery URL or binds their sheet.
    for (const node of this.root.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style,link[rel="stylesheet"]')) {
      if (node.localName === 'style') {
        if (node.sheet) result.push(node.sheet)
      } else {
        const link = node as HTMLLinkElement
        if (!this.owns(link.href)) continue
        if (this.delivery?.development) {
          if (link.sheet) result.push(link.sheet)
        } else this.attach(link)
      }
    }
    return result
  }

  dispose() {
    this.disposed = true
    for (const [link, state] of this.attached) {
      state.style?.remove()
      link.disabled = state.disabled
    }
    this.attached.clear()
    this.collectAssets()
  }
}
