import { migrationIllustration } from '../../../../content/guide/migration/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Question: which screens need checking when only one is converted?
// One shared entry fans out to three consumers. The batch is marked on Account;
// a single bracket spans every consumer, making the larger verification scope visible.
// These are dependency edges, not execution order or a promise of CSS isolation.
// Content-sized groups and CSS branches keep connections attached as labels change.
export default {
  id: 'shared-scope',
  render(theme: Theme) {
    const { sheet, row, label, icon, scene } = drawing(theme)
    const l = migrationIllustration.labels
    const screen = (name: string, converted = false) => `<div class="migration-consumer${converted ? ' is-batch' : ''}">
      <div class="migration-screen">${icon('window')}${label(name)}</div>
      ${label(converted ? l.converted : l.retained, 'note')}
    </div>`
    return scene(migrationIllustration.title, migrationIllustration.alt, `
      <div class="migration-reach">
        ${sheet(0, 0, undefined, undefined, row(icon('fileCode') + label(l.entry)) + label(l.existing, 'body') + label(l.master, 'body'))}
        <div class="migration-trunk">${label(l.connection, 'edge')}</div>
        <div class="migration-consumers">
          ${screen(l.account, true)}${screen(l.billing)}${screen(l.reports)}
        </div>
        <div class="migration-verification">${label(l.verify, 'note')}</div>
      </div>
    `)
  }
}
