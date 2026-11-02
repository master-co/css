import { leadStory, objectStory, practiceStory, publication } from './stories'

/** Public, reproducible examples shared by the article, artwork and verification. */
export const releaseTheme = { light: '#665442', dark: '#d7c2a6', inset: '1.5rem' } as const

export const themeSource = `@theme {
  --color-brand: light-dark(${releaseTheme.light}, ${releaseTheme.dark});
  --spacing-story: ${releaseTheme.inset};
}
`

export const themeMarkup = `<article class="max-w-sm mx-auto overflow-hidden r-lg bg-surface-raised shadow-sm">
  <img class="block w-full h-auto object-cover (aspect-ratio:16/7)" src="${leadStory.image.src}" alt="${leadStory.image.alt}" width="${leadStory.image.width}" height="${leadStory.image.height}" />
  <div class="grid gap-sm p-story">
    <p class="m(0) text-xs fg-brand">${publication.name} / Issue ${publication.issue}</p>
    <h2 class="m(0) text-2xl font-regular fg-text-strong">${leadStory.title}</h2>
    <p class="m(0) text-sm fg-text-muted">A field note on slowing down, looking closer, and finding a little more in the spaces we inhabit.</p>
    <details class="text-sm">
      <summary class="(cursor:pointer) fg-brand py-xs">Read the field note</summary>
      <p class="m(0) pt-sm fg-text-body">${leadStory.paragraphs[0]} ${leadStory.paragraphs[2]}</p>
    </details>
  </div>
</article>`

export const componentSource = `@layer components {
  .story-link {
    display: inline-flex;
    padding-inline: 1rem;
    padding-block: 0.5rem;
    border-radius: 0.375rem;
    background-color: var(--color-surface-raised);
    color: var(--color-text-body);
    text-decoration: none;
  }
}`

export const componentMarkup = `<a class="story-link" href="/journal">Read the journal</a>
<a class="story-link px-lg" href="/journal">Read the journal</a>`

export const anatomyClass = 'fg-blue-70:hover@sm'
export const lintBefore = '<article class="p-md p-lg">Field notes</article>'
export const lintAfter = '<article class="p-md">Field notes</article>'

/** A publication specimen, rendered with real preset classes and project-owned native CSS. */
export const fieldworkSource = `${themeSource}
@layer components {
  .fieldwork { font-family: Geist, sans-serif; }
  .fieldwork p, .fieldwork h2, .fieldwork h3 { margin: 0; }
  .fieldwork h2, .fieldwork h3 { font-weight: 400; }
  .fieldwork-header { padding: 16px 24px; border-bottom: 1px solid var(--color-line-subtle); }
  .fieldwork-wordmark { font-size: 22px; font-weight: 500; letter-spacing: -.06em; }
  .fieldwork-edition { font-size: 11px; letter-spacing: .08em; }
  .fieldwork-grid { display: grid; grid-template-columns: 1.65fr 1fr; }
  .fieldwork-lead { border-right: 1px solid var(--color-line-subtle); }
  .fieldwork-photo { display: block; width: 100%; height: 131px; object-fit: cover; border-radius: 4px; outline: 1px solid rgb(0 0 0 / .1); outline-offset: -1px; }
  .fieldwork-kicker { font-size: 10px; letter-spacing: .1em; line-height: 16px; text-transform: uppercase; }
  .fieldwork-heading { font-size: 27px; line-height: 1.08; letter-spacing: -.04em; }
  .fieldwork-deck { font-size: 12px; line-height: 1.6; }
  .fieldwork-meta { font-size: 10px; line-height: 16px; }
  .fieldwork-sidebar { display: grid; align-content: start; gap: 14px; }
  .fieldwork-sidebar h3 { font-size: 20px; line-height: 1.2; letter-spacing: -.025em; }
  .fieldwork-note { display: grid; grid-template-columns: 1fr 56px; align-items: start; gap: 12px; padding-top: 16px; border-top: 1px solid var(--color-line-subtle); }
  .fieldwork-note img { width: 56px; height: 64px; object-fit: cover; border-radius: 3px; }
  .fieldwork-note-arrow { justify-self: end; font-size: 20px; font-weight: 350; }
  .fieldwork-note h3 { font-size: 13px; line-height: 1.4; letter-spacing: -.01em; }
  .fieldwork-footer { padding: 8px 24px; line-height: 16px; border-top: 1px solid var(--color-line-subtle); font-size: 10px; }
}`

export const fieldworkMarkup = `<section class="fieldwork r-lg bg-surface-raised fg-text-body overflow-hidden shadow-sm">
  <header class="fieldwork-header flex items-center justify-between gap-md">
    <span class="fieldwork-wordmark fg-text-strong">${publication.name}<span class="fg-brand">.</span></span>
    <span class="fieldwork-edition fg-text-muted">AN INDEPENDENT JOURNAL · ISSUE ${publication.issue}</span>
  </header>
  <div class="fieldwork-grid">
    <article class="fieldwork-lead grid gap-sm p-story">
      <img class="fieldwork-photo" src="${leadStory.image.src}" alt="${leadStory.image.alt}" width="${leadStory.image.width}" height="${leadStory.image.height}" />
      <p class="fieldwork-kicker fg-brand">${leadStory.category}</p>
      <h2 class="fieldwork-heading fg-text-strong">${leadStory.title.replace(', ', ',<br>')}</h2>
      <p class="fieldwork-deck fg-text-muted">${leadStory.description}</p>
      <p class="fieldwork-meta fg-text-muted">FIELD NOTE 01 <span>—</span> AT HOME</p>
    </article>
    <aside class="fieldwork-sidebar p-story">
      <p class="fieldwork-kicker fg-brand">The art of noticing</p>
      <h3 class="fg-text-strong">Quiet spaces.<br>Everyday rituals.</h3>
      <p class="fieldwork-deck fg-text-muted">${publication.introduction}</p>
      <article class="fieldwork-note">
        <div class="grid gap-xs"><p class="fieldwork-meta fg-text-muted">02 / OBJECTS</p><h3 class="fg-text-strong">${objectStory.title}</h3></div>
        <img src="${objectStory.image.src}" alt="${objectStory.image.alt}" width="${objectStory.image.width}" height="${objectStory.image.height}" />
      </article>
      <article class="fieldwork-note">
        <div class="grid gap-xs"><p class="fieldwork-meta fg-text-muted">03 / IN PRACTICE</p><h3 class="fg-text-strong">${practiceStory.title}</h3></div>
        <span class="fieldwork-note-arrow fg-text-muted" aria-hidden="true">↗</span>
      </article>
    </aside>
  </div>
  <footer class="fieldwork-footer flex items-center justify-between fg-text-muted">
    <span>${publication.tagline}</span><span>Made with Master CSS ↗</span>
  </footer>
</section>`
