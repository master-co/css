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
  #emittedPrefix = ''
  #ended = false
  #renderer!: MasterCSSServerRenderer
  #options!: MasterCSSHTMLDocumentOptions
  #ownsRenderer = false

  private constructor() { }

  write(chunk: string): string {
    this.assertWritable()
    this.#sourceHTML += chunk
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
    return prefix
  }

  end(finalChunk = ''): MasterCSSHTMLStreamEndResult {
    this.assertWritable()
    const finalPrefix = finalChunk ? this.write(finalChunk) : ''
    try {
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
    this.#emittedPrefix = ''
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
