import { themeSource } from './examples'
import { leadStory, objectStory, practiceStory, publication } from './stories'

export const journalTitle = 'An idea, given a place on the web'
export const journalSetup = "Add the CSS after @import '@master/css' in your app stylesheet. Place these assets at the paths shown in the source, or update the HTML and @font-face URLs to use your own."
export const journalAssets = [
  { label: 'White-oak interior', href: leadStory.image.src },
  { label: 'Ceramic study', href: objectStory.image.src },
  { label: 'Geist variable font', href: '/fonts/GeistVariable.woff2' }
] as const

/** The opening publication is an actual document: its controls read stories, not mock actions. */
export const journalSource = `@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/GeistVariable.woff2') format('woff2');
}
${themeSource}
@theme {
  --font-sans: 'Geist';
}
@layer components {
  .journal { font-family: var(--font-family-sans); font-size: 13px; line-height: 1.6; font-weight: 350; }
  .journal :where(h2, h3, p) { margin: 0; }
  .journal a { color: inherit; text-decoration: none; }
  .journal a:hover { text-decoration: underline; text-underline-offset: .2em; }
  .journal :focus-visible { outline: 2px solid var(--color-brand); outline-offset: 4px; }
  .journal-head { padding: 20px 24px; border-bottom: 1px solid var(--color-line-subtle); }
  .journal-brand { font-size: 25px; line-height: 1; font-weight: 500; letter-spacing: -.06em; }
  .journal-edition { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
  .journal-nav { display: flex; flex-wrap: wrap; gap: 12px 20px; font-size: 12px; }
  .journal-main { min-width: 0; }
  .journal-photo { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 4px; outline: 1px solid light-dark(rgb(0 0 0 / .08), rgb(255 255 255 / .08)); outline-offset: -1px; }
  .journal-kicker { font-size: 11px; line-height: 1.5; letter-spacing: .09em; text-transform: uppercase; }
  .journal-title { max-width: 12ch; font-size: clamp(28px, 4.8vw, 36px); line-height: 1.08; font-weight: 400; letter-spacing: -.04em; }
  .journal-deck { max-width: 44ch; font-size: 14px; line-height: 1.7; }
  .journal-meta { font-size: 11px; line-height: 1.5; }
  .journal-read { border-top: 1px solid var(--color-line-subtle); padding-top: 4px; }
  .journal-read > summary { width: fit-content; padding: 10px 0; cursor: pointer; font-size: 13px; }
  .journal-copy { display: grid; gap: 12px; padding-top: 6px; font-size: 14px; line-height: 1.8; }
  .journal-aside { min-width: 0; border-top: 1px solid var(--color-line-subtle); }
  .journal-aside-title { font-size: 23px; line-height: 1.2; letter-spacing: -.03em; font-weight: 400; }
  .journal-story { border-top: 1px solid var(--color-line-subtle); }
  .journal-story > summary { display: flex; align-items: start; justify-content: space-between; gap: 12px; padding-block: 20px; cursor: pointer; list-style: none; }
  .journal-story > summary::-webkit-details-marker { display: none; }
  .journal-story-title { margin-top: 7px; font-size: 16px; line-height: 1.4; font-weight: 400; letter-spacing: -.015em; }
  .journal-story-image { display: block; width: 64px; height: 76px; object-fit: cover; border-radius: 3px; }
  .journal-story-arrow { font-size: 20px; line-height: 1; }
  .journal-story[open] .journal-story-arrow { transform: rotate(45deg); }
  .journal-story > p { padding-bottom: 20px; font-size: 13px; line-height: 1.8; }
  .journal-about { display: grid; gap: 8px; padding: 20px 24px; border-top: 1px solid var(--color-line-subtle); font-size: 12px; line-height: 1.7; }
  .journal-about p { max-width: 48ch; }
  @media (width >= 38rem) {
    .journal-grid { display: grid; grid-template-columns: 1.6fr 1fr; }
    .journal-aside { border-top: 0; border-left: 1px solid var(--color-line-subtle); }
    .journal-about { grid-template-columns: 1fr auto; align-items: center; gap: 24px; }
  }
  @media (width < 24rem) {
    .journal-head { padding: 20px; }
    .journal-edition-label { display: none; }
    .journal-nav { gap: 16px; }
  }
}`

export const journalMarkup = `<article class="journal r-lg overflow-hidden bg-surface-raised fg-text-body shadow-sm" aria-label="Fieldwork journal">
  <header class="journal-head grid gap-md">
    <div class="flex flex-wrap items-center justify-between gap-md">
      <span class="journal-brand fg-text-strong">${publication.name}<span class="fg-brand">.</span></span>
      <span class="journal-edition fg-text-muted"><span class="journal-edition-label">An independent journal · </span>Issue ${publication.issue}</span>
    </div>
    <nav class="journal-nav fg-text-muted" aria-label="Journal sections">
      <a href="#fieldwork-lead">Featured story</a>
      <a href="#fieldwork-notes">Field notes</a>
      <a href="#fieldwork-about">About</a>
    </nav>
  </header>
  <div class="journal-grid">
    <section id="fieldwork-lead" class="journal-main grid gap-md p-story" aria-labelledby="fieldwork-title">
      <img class="journal-photo" src="${leadStory.image.src}" alt="${leadStory.image.alt}" width="${leadStory.image.width}" height="${leadStory.image.height}" />
      <p class="journal-kicker fg-brand">${leadStory.category}</p>
      <h2 id="fieldwork-title" class="journal-title fg-text-strong">${leadStory.title}</h2>
      <p class="journal-deck fg-text-muted">${leadStory.description}</p>
      <p class="journal-meta fg-text-muted">Field note 01 — At home</p>
      <details class="journal-read">
        <summary class="fg-brand">Read the field note</summary>
        <div class="journal-copy">
          ${leadStory.paragraphs.map(text => `<p>${text}</p>`).join('\n          ')}
        </div>
      </details>
    </section>
    <aside id="fieldwork-notes" class="journal-aside p-story" aria-labelledby="fieldwork-notes-title">
      <div class="grid gap-sm pb-lg">
        <p class="journal-kicker fg-brand">The art of noticing</p>
        <h2 id="fieldwork-notes-title" class="journal-aside-title fg-text-strong">Quiet spaces.<br>Everyday rituals.</h2>
        <p class="journal-deck fg-text-muted">${publication.introduction}</p>
      </div>
      <details class="journal-story">
        <summary>
          <span><span class="journal-meta fg-text-muted">${objectStory.category}</span><span class="journal-story-title block fg-text-strong">${objectStory.title}</span></span>
          <img class="journal-story-image" src="${objectStory.image.src}" alt="${objectStory.image.alt}" width="${objectStory.image.width}" height="${objectStory.image.height}" />
        </summary>
        <p>${objectStory.body}</p>
      </details>
      <details class="journal-story">
        <summary>
          <span><span class="journal-meta fg-text-muted">${practiceStory.category}</span><span class="journal-story-title block fg-text-strong">${practiceStory.title}</span></span>
          <span class="journal-story-arrow fg-text-muted" aria-hidden="true">+</span>
        </summary>
        <p>${practiceStory.body}</p>
      </details>
    </aside>
  </div>
  <footer id="fieldwork-about" class="journal-about fg-text-muted">
    <p>Fieldwork is an illustrative journal about thoughtful spaces and everyday rituals, created for the Master CSS 2.0 release.</p>
    <span>${publication.tagline}</span>
  </footer>
</article>`

export const journalCaption = 'Resize the journal, change its theme, or open a story. Built with Master CSS and native CSS; photographs generated for this example.'
export const journalDescription = 'Fieldwork pairs a white-oak interior story with two field notes on objects and considered living. The lead story and sidebar share p-story and fg-brand. At a viewport of 38rem or wider they sit side by side; below it they form one reading column. Native disclosures reveal all three stories, and navigation stays within the example.'
