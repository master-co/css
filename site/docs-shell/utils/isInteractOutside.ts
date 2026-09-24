export function isInteractOutside(
  target: Element,
  event: any,
  senseEdge = 0
): boolean {
  const x = event.clientX
  const y = event.clientY
  const rect = target.getBoundingClientRect()
  const top = rect.top
  const left = rect.left

  return top > y + senseEdge
    || top + rect.height < y - senseEdge
    || left > x + senseEdge
    || left + rect.width < x - senseEdge
}