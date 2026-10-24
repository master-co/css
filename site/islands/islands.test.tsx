import '../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToReadableStream, renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import { hasClientDirective } from './vite'

const { clientReference, encodeIslandProps } = await import('./server')
const { SiteRoot } = await import('../docs-shell/layouts/root')

const reference = { id: 'components/Counter.tsx', name: 'default' }
const site = { locale: 'en' as const, pathname: '/guide', translations: {} }

function Counter({ label, children }: { label: string, children?: ReactNode }) {
  return <button data-label={label}>{children}</button>
}
async function ServerNote() {
  return <em>server</em>
}
const ClientCounter = clientReference(Counter, reference.id, reference.name)
const ClientBadge = clientReference(function Badge({ text }: { text: string }) { return <b>{text}</b> }, 'components/Badge.tsx', 'Badge')

async function render(node: ReactNode) {
  const stream = await renderToReadableStream(<SiteRoot {...site}>{node}</SiteRoot>)
  await stream.allReady
  return new Response(stream).text()
}

test('detects the module directive after leading comments only', () => {
  assert.equal(hasClientDirective("// note\n/* block */\n'use client'\nexport default 1"), true)
  assert.equal(hasClientDirective("import x from 'y'\n'use client'"), false)
})

test('passes hooks, contexts and constants through unchanged', () => {
  const useValue = () => 1
  assert.equal(clientReference(useValue, reference.id, 'useValue'), useValue)
  assert.equal(clientReference(42, reference.id, 'answer'), 42)
})

test('renders a client component as an island with serialized props', async () => {
  const html = await render(<ClientCounter label="Add" />)
  const island = html.match(/<site-island data-island="components\/Counter.tsx#default" data-props="([^"]*)" data-id-prefix="([^"]+)">(.*)<\/site-island>/)
  assert.ok(island, html)
  assert.deepEqual(JSON.parse(island[1].replaceAll('&quot;', '"')), { label: 'Add' })
  assert.equal(island[3], '<button data-label="Add"></button>')
})

test('keeps server children static and client children hydratable', async () => {
  const html = await render(<ClientCounter label="Add"><ServerNote /><ClientBadge text="new" /></ClientCounter>)
  assert.match(html, /<button data-label="Add"><site-slot data-slot="0"><em>server<\/em><\/site-slot><b>new<\/b><\/button>/)
  assert.deepEqual(encodeIslandProps({ children: [<ServerNote key="a" />, <ClientBadge key="b" text="new" />] }, reference), {
    children: [{ $s: 0 }, { $e: 'components/Badge.tsx#Badge', k: 'b', p: { text: 'new' } }]
  })
})

test('nested client components render inline inside an island', async () => {
  const Outer = clientReference(() => <ClientBadge text="inner" />, 'components/Outer.tsx', 'default')
  const html = await render(<Outer />)
  assert.equal(html.match(/<site-island/g)?.length, 1)
  assert.match(html, /<b>inner<\/b>/)
})

test('rejects props a browser cannot receive', () => {
  assert.throws(() => encodeIslandProps({ onClick: () => {} }, reference), /cannot pass a function/)
  assert.deepEqual(encodeIslandProps({ $e: 'literal', when: new Date(0) }, reference), { $o: { $e: 'literal', when: { $d: '1970-01-01T00:00:00.000Z' } } })
})

test('requires the site context outside islands', () => {
  assert.throws(() => renderToString(<ClientCounter label="Add" />), /must render inside SiteRoot/)
})

test('fragments serialize apart from client references', async () => {
  const encoded = encodeIslandProps({ children: <><b>a</b><ClientBadge text="b" /></> }, reference) as any
  assert.equal(encoded.children.$e, '')
  assert.equal(encoded.children.p.children[1].$e, 'components/Badge.tsx#Badge')
  assert.equal(encoded.children.p.children[0].$e, 'b')
})
