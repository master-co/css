/** Observe native events without enabling, canceling or simulating drag behavior. */
export function demoDragReadings(doc: Document) {
  const counts = new Map<string, number>()
  const read = (event: DragEvent) => {
    const target = (event.target as Element).closest<HTMLElement>('[data-target]')
    if (!target?.id) return
    if (event.type === 'dragstart') counts.set(target.id, (counts.get(target.id) ?? 0) + 1)
    doc.querySelectorAll<HTMLOutputElement>('[data-drag-readout]').forEach(output => {
      if (output.dataset.dragReadout !== target.id) return
      const count = counts.get(target.id) ?? 0
      output.textContent = `${count} ${count === 1 ? 'start' : 'starts'}${event.type === 'dragend' ? ' · ended' : ''}`
    })
  }
  doc.addEventListener('dragstart', read)
  doc.addEventListener('dragend', read)
  return () => {
    doc.removeEventListener('dragstart', read)
    doc.removeEventListener('dragend', read)
  }
}
