import { MasterCSSError } from '@master/css-schema'
import type {
  MasterCSSServerRenderer
} from './create-server-renderer'
import type {
  MasterCSSHTMLDocumentOptions,
  MasterCSSHTMLRenderResult
} from './render'

export interface MasterCSSHTMLStreamEndResult {
  readonly chunk: string
  readonly result: MasterCSSHTMLRenderResult
}

let bindHTMLRenderSession: (
  renderer: MasterCSSServerRenderer,
  options: MasterCSSHTMLDocumentOptions,
  ownsRenderer: boolean
) => MasterCSSHTMLRenderSession

export class MasterCSSHTMLRenderSession implements Disposable {
  #sourceHTML = ''
  #renderedHTML = ''
  #emittedPrefix = ''
  #earlyResult?: MasterCSSHTMLRenderResult
  #ended = false
  #renderer!: MasterCSSServerRenderer
  #options!: MasterCSSHTMLDocumentOptions
  #ownsRenderer = false

  private constructor() { }

  write(chunk: string): string {
    this.assertWritable()
    this.#sourceHTML += chunk
    if (this.#earlyResult) {
      this.#renderedHTML += chunk
      return chunk
    }

    const headEnd = /<\/head\s*>/iu.exec(this.#sourceHTML)
    if (headEnd) {
      const sourceBoundary = headEnd.index + headEnd[0].length
      const result = this.#renderer.renderHTML(
        this.#sourceHTML,
        this.#options
      )
      const renderedHeadEnd = /<\/head\s*>/iu.exec(result.html)
      if (!renderedHeadEnd) {
        throw new MasterCSSError({
          code: 'STREAM_PREFIX_MISMATCH',
          domain: 'server',
          message: 'The rendered document no longer contains the streamed HTML head.'
        })
      }
      const renderedBoundary = renderedHeadEnd.index + renderedHeadEnd[0].length
      const renderedPrefix = result.html.slice(0, renderedBoundary)
      if (!renderedPrefix.startsWith(this.#emittedPrefix)) {
        throw new MasterCSSError({
          code: 'STREAM_PREFIX_MISMATCH',
          domain: 'server',
          message: 'The rendered document no longer matches the emitted HTML stream prefix.'
        })
      }
      const output = renderedPrefix.slice(this.#emittedPrefix.length)
        + this.#sourceHTML.slice(sourceBoundary)
      this.#earlyResult = result
      this.#renderedHTML += output
      return output
    }

    if (this.#emittedPrefix) return ''

    // CSS and hydration assets are inserted inside <head>, so a canonical document
    // prefix through the opening <head> tag can be forwarded before the document
    // snapshot is known. Be deliberately conservative: emitting normalized tag
    // syntax or attributes would make a later DOM serialization impossible to join.
    const prefix = this.#sourceHTML.match(
      /^(?:(?:<!doctype html>|<!DOCTYPE html>)\s*)?<html>\s*<head>/
    )?.[0]
    if (!prefix) return ''
    this.#emittedPrefix = prefix
    this.#renderedHTML += prefix
    return prefix
  }

  end(finalChunk = ''): MasterCSSHTMLStreamEndResult {
    this.assertWritable()
    const finalPrefix = finalChunk ? this.write(finalChunk) : ''
    try {
      if (this.#earlyResult) {
        const result = Object.freeze({
          ...this.#earlyResult,
          html: this.#renderedHTML
        })
        return Object.freeze({ chunk: finalPrefix, result })
      }
      const result = this.#renderer.renderHTML(this.#sourceHTML, this.#options)
      if (
        this.#emittedPrefix
        && !result.html.startsWith(this.#emittedPrefix)
      ) {
        throw new MasterCSSError({
          code: 'STREAM_PREFIX_MISMATCH',
          domain: 'server',
          message: 'The rendered document no longer matches the emitted HTML stream prefix.'
        })
      }
      const chunk = finalPrefix + result.html.slice(this.#emittedPrefix.length)
      return Object.freeze({ chunk, result })
    } finally {
      this.dispose()
    }
  }

  dispose() {
    if (this.#ended) return
    this.#sourceHTML = ''
    this.#renderedHTML = ''
    this.#emittedPrefix = ''
    this.#earlyResult = undefined
    this.#ended = true
    if (this.#ownsRenderer) this.#renderer.dispose()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private assertWritable() {
    if (this.#ended) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'server',
        message: 'The Master CSS HTML render session has ended.'
      })
    }
  }

  static {
    bindHTMLRenderSession = (renderer, options, ownsRenderer) => {
      const session = new MasterCSSHTMLRenderSession()
      session.#renderer = renderer
      session.#options = options
      session.#ownsRenderer = ownsRenderer
      return session
    }
  }
}

/** @internal */
export function bindHTMLRenderSessionInternal(
  renderer: MasterCSSServerRenderer,
  options: MasterCSSHTMLDocumentOptions,
  ownsRenderer = false
) {
  return bindHTMLRenderSession(renderer, options, ownsRenderer)
}
