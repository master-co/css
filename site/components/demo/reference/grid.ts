import type { DemoScene, ReferenceDemoSection } from './types'
import { label } from './html'
import { paintLayout } from './layout-html'

const comparisons: Record<string, string[]> = {
  'set-the-native-grid-shorthand': ['Explicit template · column flow', 'Grid reset · default row flow'],
  'define-rows-columns-and-auto-flow-together': ['Implicit rows · row flow', 'Implicit columns · column flow'],
  'fill-by-column': ['Row flow', 'Column flow'],
  'fill-gaps-densely': ['Sparse · keep moving forward', 'Dense · fill earlier holes'],
  'place-an-item-by-columns': ['Column lines 2 → 4', 'Column lines 1 → −1'],
  'place-an-item-by-rows': ['Row lines 1 → 3', 'Row lines 1 → −1'],
  'define-rows-and-columns-together': ['Explicit rows and columns', 'No template · implicit settings retained'],
}

/** Track definitions and placement come only from each section's complete HTML. */
export function grid(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const item = ['grid-area', 'grid-column', 'grid-row'].includes(page)
  const property = ({ 'grid-columns': 'grid-template-columns', 'grid-rows': 'grid-template-rows' } as Record<string, string>)[page] ?? page
  const names = id === 'use-minmax'
    ? page === 'grid-template-columns' ? ['Automatic track minimum', 'Zero track minimum'] : ['One line · minimum height', 'Four lines · content height']
    : comparisons[id]
  const html = section.html.map((source, index) => {
    const prefix = section.html.length > 1 ? `example-${index}-` : ''
    const layout = `${prefix}layout`, target = `${prefix}target`
    const reading = (name: string, element: string, value: string) => `<span>${name} <output data-style-readout="${element}" data-style-property="${value}"${/grid-template-(columns|rows)/.test(value) ? ' data-round-pixels' : ''}>—</output></span>`
    const placement = item ? reading('Blue placement', target, property) : ''
    const areas = page === 'grid-template-areas' ? reading('Areas', layout, 'grid-template-areas') : ''
    return `<section data-ui="layout-example">${names ? label(names[index]) : ''}${paintLayout(source, prefix, index === 0 ? item ? 'target' : 'layout' : '')}<div data-ui="layout-readings">${reading('Columns', layout, 'grid-template-columns')}${reading('Rows', layout, 'grid-template-rows')}${reading('Flow', layout, 'grid-auto-flow')}${placement}${areas}<span>Blue item <output data-size-readout="${target}">—</output></span><span>Blue offset <output data-position-readout="${target}" data-position-origin="${layout}">—</output></span></div></section>`
  }).join('')
  const captions: Record<string, string> = {
    'grid': 'Read the actual tracks and flow below each grid. The static grid utility establishes display; grid:* supplies the shorthand.',
    'grid-area': 'The blue region follows its authored line boundaries or area name. Siblings occupy the same real grid; labels do not add cells.',
    'grid-auto-columns': 'The violet first column is explicit. The blue column and its following sibling use the implicit-column size.',
    'grid-auto-rows': 'The first row is explicit. The blue item belongs to an implicit row created for additional content.',
    'grid-auto-flow': id === 'fill-gaps-densely' ? 'Compare the position of 03, then focus 01 and press Tab. Visual packing changes; source-order keyboard traversal does not.' : 'Read the numbers in DOM order. Track definitions stay the same while placement searches across rows or down columns.',
    'grid-column': 'Column lines bound each track. The blue width includes every track and internal gap in its span.',
    'grid-row': 'Row lines bound each track. The blue height includes every track and internal gap in its span.',
    'grid-columns': 'The columns share the width left after gaps. Additional items create new rows while preserving source order.',
    'grid-rows': 'Follow the numbers down each column. The fixed container height makes the equal row sizes measurable.',
    'grid-template': 'The explicit template and implicit-grid settings are separate. Read the resulting rows, columns and flow.',
    'grid-template-areas': 'Header, Nav and Content keep their area names. The parent supplies both the region map and its track sizes.',
    'grid-template-columns': id === 'use-minmax' ? 'The content stays 192px wide in both examples. The blue cell clips excess content when its track is allowed to shrink.' : 'Fixed tracks and gaps reserve space first. Fractional tracks divide what remains, subject to their minimums.',
    'grid-template-rows': id === 'use-minmax' ? 'The taller content grows the first row; the fractional second row receives less of the fixed height.' : 'The row readings include every resolved track. The gap is space between tracks, not part of their individual heights.',
  }
  return { html, caption: captions[page], sizing: 'content', inspect: id === 'apply-conditionally' ? [] : undefined }
}
