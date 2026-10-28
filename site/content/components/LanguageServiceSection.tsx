import './editor-tiles.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import EditorFigures from './EditorFigures'
import { editorFeatures } from './editor-content'
import { getEditorModel } from './editor-document'
import { HomeSectionHeader } from './HomeBento'
import { homeSections } from './home-content'

/**
 * One file in one editor. A caret and a pointer walk through the language service features in
 * turn, and every class answers the reader's pointer with the CSS the language service shows.
 */
export default function LanguageServiceSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.languageService} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="02"
          label={$('Editor')}
          title={$('Dense class strings, still readable.')}
          body={$('The language service completes classes from your manifest, shows the CSS behind each class on hover and marks colors in place.')}>
          <Link className="home-section-link" href="/guide/language-service">
            {$('Explore the language service')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <EditorFigures features={editorFeatures} model={getEditorModel()} />
      </div>
    </section>
  )
}
