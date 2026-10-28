import './editor-tiles.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import EditorFigures from './EditorFigures'
import { editorFeatures } from './editor-content'
import { getEditorModel } from './editor-document'
import { HomeSectionHeader } from './HomeBento'
import HomeIllustration, { type HomeIllustrationId } from './HomeIllustration'
import { homeSections } from './home-content'

const featureIcons = {
  complete: 'editor-manifest-completions',
  hover: 'editor-hover-inspection',
  highlight: 'editor-focused-highlighting',
  color: 'editor-color-tools'
} satisfies Record<typeof editorFeatures[number]['id'], HomeIllustrationId>

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
          icon="section-editor"
          index="02"
          label={$('Editor')}
          title={$('Dense class strings, still readable.')}
          body={$('The language service completes classes from your manifest, shows the CSS behind each class on hover and marks colors in place.')} />
        <EditorFigures features={editorFeatures} icons={editorFeatures.map(feature => <HomeIllustration icon={featureIcons[feature.id]} key={feature.id} size={96} />)} model={getEditorModel()} />
        <div className="home-editor-guide">
          <Link className="home-section-link" href="/guide/language-service">
            {$('Explore the language service')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </div>
      </div>
    </section>
  )
}
