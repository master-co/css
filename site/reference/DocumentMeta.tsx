import Link from 'internal/components/Link'
import type { ReferenceCatalog, ReferenceDocument } from './types'
import CopyExample from './CopyExample'

export default function DocumentMeta({ doc, catalog, locale, related = false }: { doc: ReferenceDocument; catalog: ReferenceCatalog; locale: string; related?: boolean }) {
  const tw = locale === 'tw'
  if (related) return <section className="reference-meta">
    <h2 id="related-reference">{tw ? '相關 Reference' : 'Related reference'}</h2>
    <nav aria-label={tw ? '相關文件' : 'Related documentation'} className="flex flex-wrap gap:md text:sm">
      {doc.related.map(id => <Link key={id} href={`/reference/${id}`}>{catalog.documents.find(item => item.id === id)?.title ?? id}</Link>)}
      {doc.guide && <Link href={doc.guide}>{tw ? '學習這個概念' : 'Learn this concept'} →</Link>}
    </nav>
    {doc.aliases.length > 0 && <details><summary>{tw ? '名稱與別名' : 'Names and aliases'}</summary><p className="reference-aliases">{doc.aliases.map(alias => <code key={alias}>{alias}</code>)}</p></details>}
  </section>
  return <div className="reference-meta">
    <div className="flex flex-wrap items-center gap:sm text:sm">
      <span>{catalog.version}</span>
      {catalog.sourceState === 'revision'
        ? <a href={`https://github.com/master-co/css/blob/${catalog.revision}/${doc.source}`} target="_blank" rel="noreferrer">{tw ? '來源' : 'Source'} {catalog.revision.slice(0, 7)}</a>
        : <span title={doc.source}>{catalog.revision.slice(0, 7)} · {tw ? '工作區內容' : 'workspace content'}</span>}
      <a href={`${tw ? '/tw' : ''}${doc.url}.md`}>Markdown</a>
      {doc.examples[0] && <CopyExample value={doc.examples[0].classes.join(' ')} locale={locale} />}
    </div>
    {tw && <p lang="zh-TW" className="text:sm">此頁正文目前以英文提供；識別字與語法保持原文。</p>}
    {doc.kind === 'utility' && <p className="text:sm">{tw ? '範例使用目前 preset；placeholder 表示宣告形式。' : 'Current preset examples; placeholders describe declaration shapes.'}</p>}
  </div>
}
