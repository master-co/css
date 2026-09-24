import type { DemoScene, ReferenceDemoSection } from './types'
import { classValue, comparison, image, label, longText, numbered, prose, specimen, tile } from './html'

export function flow(section: ReferenceDemoSection): DemoScene {
  const { page, id, classLists: lists } = section
  const target = lists[0] ?? ''
  if (page === 'clear') {
    const cleared = lists.find(value => value.includes('clear:')) ?? 'clear:both'
    const left = lists.find(value => value.includes('float:left')) ?? 'float:left w:34% h:4.5rem'
    const right = lists.find(value => value.includes('float:right')) ?? 'float:right w:34% h:8.5rem'
    const conditional = id === 'apply-conditionally'
    return {
      html: `<div data-ui="float-context">${tile('Left float', left, 'neutral').replace(' data-target', '')}${tile('Right float', right, 'violet').replace(' data-target', '')}${tile(conditional ? 'Focus with Tab' : 'Clear target', cleared, 'blue', 'width:58%;min-height:56px', conditional ? 'tabindex="0"' : '')}</div>`,
      caption: conditional ? 'Focus the blue element with Tab to clear both floats. The same change applies in the wider viewport and print preview.' : id === 'clearing-right-floats' ? 'The blue block clears the right float. Its text still wraps around the taller left float, whose box overlaps the blue background.' : 'The blue element clears the requested side. Unequal float heights make left, right and both visibly different.',
      inspect: ['clear'], sizing: 'content',
    }
  }
  if (page === 'float') {
    return {
      html: `<div data-ui="float-context">${id === 'float-elements-to-the-right' ? `<aside data-target data-ui="float-quote" class="${classValue(target)}">Good tools make room for clear thinking.</aside>` : image(target, 'data-ui="float-image"')}<p>${longText} ${prose}</p></div>`,
      caption: 'Follow how the paragraph wraps beside the floated object, then returns to the full line width.', height: 300, sizing: 'content',
    }
  }
  if (page === 'box-sizing') {
    return {
      html: comparison((lists.length ? lists : ['box-border', 'box-content']).map(value => ({ name: value, content: `${label('160px reference')}<div data-ui="box-size-guide">${tile('Content', value)}</div>` }))).replace('data-ui="comparison"', 'data-ui="comparison" data-scenario="box-sizing"'),
      caption: 'The dashed reference is 160px wide. Border-box fits inside it; content-box adds its padding and border to that width.', inspect: ['box-sizing', 'width'], sizing: 'content',
    }
  }
  if (page === 'columns' || page === 'column-span') {
    const html = section.html[0]
      .replace(/<(article|div) class="/, `<$1 data-ui="columns" data-scenario="prose-flow"${page === 'columns' ? ' data-target' : ''} class="`)
      .replace(/<(h2|h3) class="/, '<$1 data-target class="')
    return {
      html,
      caption: page === 'columns' ? 'Read down each column, then across to the next. The container grows naturally instead of forcing overflow columns.' : 'The highlighted heading belongs to the column flow. With all, it crosses the column set and the following text resumes below it.',
      sizing: 'content',
    }
  }
  if (page.startsWith('break-')) {
    const parent = lists.find(value => value.includes('columns:')) ?? 'columns:2 h:12.5rem column-fill:auto'
    const values = lists.length > 1 ? lists.slice(1, 5) : ['h:130px', target, 'h:60px', 'h:40px']
    const preview = (baseline: boolean) => `<div data-ui="columns" data-scenario="fragmentation" class="${classValue(parent)}">${values.map((value, index) => tile(index === 1 ? '02 · Target' : `0${index + 1}`, value, index === 1 ? 'blue' : 'neutral', baseline && index === 1 ? `${page}:auto` : '').replace(baseline || index !== 1 ? ' data-target' : ' data-unused', '')).join('')}</div>`
    const caption = page === 'break-inside' ? 'Both column sets are 200px tall. The blue block can split in the automatic flow; avoid keeps it together when the condition applies.' : `Both column sets are 200px tall. The forced break moves content to the next column ${page === 'break-before' ? 'before' : 'after'} the blue block when the condition applies.`
    return { html: comparison([{ name: 'Automatic breaks', content: preview(true) }, { name: 'With class', content: preview(false) }]), caption, sizing: 'content' }
  }
  if (page === 'contain') {
    const panel = (baseline: boolean) => `<div data-ui="contain"${baseline ? ' style="contain:none"' : ' data-target'} class="${classValue(target)}">${tile('Wide content', lists[1], 'violet').replace(' data-target', '')}</div>`
    return {
      html: comparison([{ name: 'No containment', content: panel(true) }, { name: 'With class', content: panel(false) }]).replace('data-ui="comparison"', 'data-ui="comparison" data-scenario="containment"'),
      caption: 'Both violet blocks keep their full width. Paint containment changes which part is visible, without resizing the child.', inspect: ['contain'], sizing: 'content',
    }
  }
  if (page === 'visibility') {
    if (section.classes.some(value => value.includes('collapse'))) {
      const table = (collapsed: boolean) => `<table data-ui="table"><tbody><tr><td>01</td><td>First row</td></tr><tr data-ui="collapse-row"${collapsed ? ' data-target' : ''} class="${classValue(collapsed ? target : '')}"><td>02</td><td>Middle row</td></tr><tr><td>03</td><td>Last row</td></tr></tbody></table>`
      return { html: comparison([{ name: 'Visible middle row', content: table(false) }, { name: 'Collapsed middle row', content: table(true) }]), caption: 'Compare the gap between rows 01 and 03. Collapsing a table row removes its space; hidden visibility on an ordinary block does not.', inspect: ['visibility'], sizing: 'content' }
    }
    return { html: `<div data-ui="flex" data-scenario="visibility">${tile('01', '', 'neutral')}${tile('02', target)}${tile('03', '', 'violet')}</div>`, caption: 'Item 02 receives the visibility class. Its space remains even when it is invisible.', inspect: ['visibility'], sizing: 'content' }
  }
  return display(section)
}

function display(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  const target = lists[0] ?? 'block'
  let html: string
  if (id.includes('table')) {
    html = section.html[0].replace('<div class="table">', '<div class="table" data-ui="table" data-target>')
  } else if (id === 'contents') {
    html = `<div data-ui="flex" class="${classValue(target)}">${tile('01', lists[1])}<div class="contents">${tile('02', lists[3], 'violet')}${tile('03', lists[4], 'violet')}</div>${tile('04', lists[5])}</div>`
  } else if (id === 'flow-root') {
    html = `<div class="flow-root" data-ui="surface">${image(lists[1], 'data-ui="float-image"')}<p>${prose}</p></div>`
  } else if (id === 'hidden') {
    html = `<div data-ui="flex" class="${classValue(target)}">${tile('01')}${tile('02', 'hidden')}${tile('03', '', 'violet')}</div>`
  } else if (id === 'inline-grid') {
    html = `<p>Before <span data-ui="inline-layout" data-target class="${classValue(target)}">${['01', '02', '03', '04'].map(value => `<span data-ui="tile">${value}</span>`).join('')}</span> after. The grid stays in the surrounding text flow.</p>`
  } else if (id === 'inline-flex') {
    html = `<p>Before <span data-ui="inline-layout" data-target class="${classValue(target)}"><span aria-hidden="true">●</span><span>In progress</span></span> after. The badge stays in the surrounding text flow.</p>`
  } else if (id === 'list-item') {
    html = `<div data-ui="list">${['01', '02', '03'].map(value => `<div data-ui="inline" data-target class="list-item">${value}</div>`).join('')}</div>`
  } else if (id === 'block--inline') {
    const variants = ['block', 'inline', 'inline-block']
    html = variants.map(value => `<p>Before <span data-ui="inline" data-target class="${classValue(value)}">${value}</span> after. Follow where this line continues.</p>`).join('')
  } else {
    html = specimen(numbered(id === 'grid' ? 4 : 3), target, 'data-ui="display"')
  }
  const captions: Record<string, string> = {
    'block--inline': 'A block starts a new line. Inline and inline-block boxes remain beside the surrounding text.',
    flex: 'The three direct children share a flex row with the authored gap.',
    'inline-flex': 'The badge aligns its children with flex while staying in the paragraph’s line of text.',
    grid: 'Four direct children occupy two explicitly defined grid columns.',
    'inline-grid': 'The four cells form a grid inside one inline box; the paragraph continues beside it.',
    table: 'Header, body and footer groups share the same table columns. This CSS-only structure has no native table semantics.',
    contents: 'The violet items belong to the contents wrapper. All four items participate in the outer flex layout.',
    'flow-root': 'The outlined parent contains the floated image as well as the paragraph.',
    'list-item': 'Each element produces its own list marker. Use native list elements when the content is a semantic list.',
    hidden: 'Item 02 is still in the DOM, but display:none removes its box and its space.',
    'apply-conditionally': 'Resize to switch between grid and flex. Print preview uses ordinary block flow at every page width.',
  }
  return { html, caption: captions[id], height: 280, sizing: 'content' }
}
